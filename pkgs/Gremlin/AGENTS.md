# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mïmis is a P2P distributed file system that combines IPFS (content-addressed storage), JanusGraph/Gremlin (graph database for structure), and Ethereum (wallet-based identity). This package (`gremlin-mimis`) is the SvelteKit web frontend.

The system uses Copy on Write to provide an apparently mutable file system on top of IPFS's immutable content-addressed substrate. Structural changes are exchanged as CBOR-DAG nodes, one IPFS node per node in the tree. Updates are broadcast tracked in JanusGraph while file data remains immutable on IPFS.

## Commands

```bash
pnpm run dev          # Dev server on port 5173
pnpm run build        # Production build (Cloudflare Pages)
pnpm run check        # TypeScript + Svelte type checking
pnpm run check:watch  # Type checking in watch mode
pnpm run lint         # ESLint
pnpm run deploy       # Build + deploy to Cloudflare Pages
```

### JanusGraph (local)

```bash
docker compose up     # Start JanusGraph on port 8182
docker exec -e GREMLIN_REMOTE_HOSTS=janusgraph -it authed-janusgraph bin/gremlin.sh  # Gremlin console
```

## Architecture

### SvelteKit Configuration

- **Adapter**: Cloudflare (`@sveltejs/adapter-cloudflare`)
- **Experimental features enabled**: `remoteFunctions` (SvelteKit server-side RPC) and async Svelte compiler
- Uses Svelte 5 with `$state` runes for reactive state
- Settings persisted to `localStorage` via `Settings` class in `src/lib/settings.svelte.ts`

### Remote Functions (`.remote.ts`)

Files in `src/lib/` suffixed with `.remote.ts` are SvelteKit remote functions — they execute server-side Gremlin queries and return results to the client. Read-only operations use `query` from `$app/server`; mutating operations use `command`. All use Valibot for input schema validation.

### Graph Interaction Functions

**`searchFor.remote.ts`** — The primary navigation query. Starting from the Root vertex, it walks `CONTAINS` edges matching each path segment. At each step it also traverses `MOUNT` edges (ordered by `order` property, up to `maxMountDepth`) to resolve union mounts. Returns child entries with their name, type (`spot` or `image`), and CID if a representation exists. Uses `coalesce` to check for image representations on children first, then on the node itself, then falls back to a CID-less spot.

**`createSpot.remote.ts`** — Creates Spot nodes along a path. Uses `coalesce` at each path segment to either find an existing `CONTAINS` edge with that path or create a new `Spot` vertex and `CONTAINS` edge. If no `containerId` is provided, merges/creates the Root node first.

**`addFiles.remote.ts`** — Adds file representations to a container Spot. Splits filenames into title and extension, creating intermediate Spot nodes for each. For each file, creates a `File` vertex with `cid` and `size` properties, linked via a `REPRESENTATION` edge typed by MIME type. Implements versioning: when a representation of the same type already exists, a `PREVIOUS` edge links the new File to the old one.

**`spotId.remote.ts`** — Like `searchFor` but returns only the vertex ID of the Spot at the given path. Uses the same mount-traversal logic.

**`nodeInfo.remote.ts`** — Returns full metadata for a vertex: its label, properties, and outgoing `CONTAINS`/`REPRESENTATION` edges with their target IDs.

**`cidTree2Janus.ts`** — Walks a CID tree (from `fileTree2CIDTree`) and writes it into JanusGraph by calling `createSpot` and `addFiles` for each file node.

**`janus2DAG.ts`** — Serializes the JanusGraph tree to an immutable IPFS DAG. Recursively walks from a root node via `nodeInfo`, encodes each node as DAG-CBOR, writes blocks to IPFS and/or a CAR file. The final output is signed with the user's Ethereum wallet via EIP-712 typed data signing, producing a signed update CID.

### Graph Data Model

The graph has **Account** nodes at the top level connected to a single **Root** node via `ACCOUNT` edges with a `signer` value. **Spots** (conceptual nodes / "nöopoints“) are arranged hierarchically below Root via `CONTAINS` edges with `path` attributes. Each Spot can have file **representations** (one per MIME type) stored on IPFS, linked via `REPRESENTATION` edges. New representations of the same type link to the previous via `PREVIOUS` edges (versioning). **Union mounts** (`MOUNT` edges with an `order` property) layer multiple trees together. Account tree updates (i.e. layers in some union mount) are signed with Ethereum keypairs.

### Key Integration Points

- **JanusGraph**: Connected via `gremlin` npm package using WebSocket + SASL auth (`src/lib/janusgraph.ts`)
- **IPFS**: Via `kubo-rpc-client` for local Kubo daemon, with optional Storacha CDN support
- **Ethereum**: Via `@reown/appkit` + `wagmi` for wallet connection and EIP-712 signing

### Routing

The app uses a single catch-all route (`src/routes/[...path]/+page.svelte`) that maps URL paths to graph traversals through the Spot hierarchy.

## Environment Variables

All prefixed with `PUBLIC_` (SvelteKit public env). Key ones:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PUBLIC_JANUSGRAPH_URL` | `wss://janus.mimis.dhappy.org/gremlin` | Graph DB WebSocket endpoint |
| `PUBLIC_JANUSGRAPH_USERNAME` | `mimis` | Graph DB auth user |
| `PUBLIC_JANUSGRAPH_PASSWORD` | *(set in .env)* | Graph DB auth password |
| `PUBLIC_IPFS_API` | `http://localhost:5001/api/v0` | Kubo RPC endpoint |
| `PUBLIC_IPFS_URL_PATTERN` | `http://{cid}.ipfs.localhost:8080{path}` | IPFS gateway URL template |
| `PUBLIC_USE_KUBO` | `true` | Enable local IPFS |
| `PUBLIC_USE_STORACHA` | `false` | Enable Storacha CDN |
| `PUBLIC_DEBUGGING` | `false` | Debug logging (also toggleable via `?debug` query param) |

## Node Version

Requires Node v24+ (see `.node-version`).
