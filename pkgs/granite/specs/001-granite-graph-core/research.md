# Phase 0 Research: Granite Core Graph

**Date**: 2026-07-09 | **Plan**: [plan.md](./plan.md)

No `NEEDS CLARIFICATION` markers remained in the Technical Context; this
document records the decisions behind each technology choice and the
alternatives weighed.

## R1. IPFS access: external Kubo daemon via `kubo-rpc-client`

- **Decision**: Talk to a locally running Kubo daemon over its RPC API using
  `kubo-rpc-client`, for both dag-cbor block put/get and pubsub.
- **Rationale**: Keeps the entire IPFS/libp2p stack out of the process —
  maximal alignment with Radical Minimalism ("most technologically incomplete
  … while retaining the character"). The sibling Gremlin package already uses
  `kubo-rpc-client` (^6), so operators run a Kubo daemon anyway. One client
  covers storage, DHT provavailability, and Gossipsub.
- **Alternatives considered**: **Helia** (in-process JS IPFS) — full control
  and no daemon dependency, but pulls in a large in-process libp2p stack
  (~dozens of transitive deps), violating Principle I harder than a daemon
  the ecosystem already requires. **Raw HTTP to Kubo** — fewer deps but
  re-implements multipart/streaming details the client already handles.

## R2. Encoding: `@ipld/dag-cbor` + `multiformats`

- **Decision**: Encode every node as a dag-cbor document; represent links as
  real CID objects (dag-cbor tag 42) via `multiformats`. CIDv1, sha2-256.
- **Rationale**: Constitution Principle II mandates CBOR-DAGs; tag-42 links
  are what makes IPFS treat child references as traversable links (pinning,
  DAG export, gateway pathing all work). Same versions as the sibling package
  (`@ipld/dag-cbor` ^9, `multiformats` ^13).
- **Alternatives considered**: `dag-json` (human-readable but not the
  constitutional format); hand-rolled CBOR (needless reimplementation).

## R3. Ethereum registry: `viem` + a ~20-line Solidity contract

- **Decision**: `GraniteRegistry.sol` holds `mapping(address => bytes) latest`
  plus `event Published(address indexed publisher, bytes root)`; a publisher
  calls `publish(bytes root)` which stores the full CIDv1 bytes and emits the
  event. Client side uses `viem` (readContract/writeContract/watchEvent).
  Development and CI run against a local anvil chain; v1 deployment targets a
  public test network (Sepolia).
- **Rationale**: The registry is constitutionally just "a durable public map
  keyed by publisher". Storing complete CID bytes (not a bytes32 digest)
  preserves codec/multihash self-description, so future codec changes need no
  contract migration. `viem` is already the workspace's Ethereum client
  (Gremlin package), is tree-shakeable, and covers account management for
  secp256k1 publisher keys.
- **Alternatives considered**: **ethers.js** (heavier, second Ethereum lib in
  the workspace); **bytes32 digest storage** (cheaper gas but loses CID
  self-description; gas is irrelevant on a testnet at v1 scale); **ENS/IPNS**
  (IPNS lacks the durable, enumerable, key-addressed map the README calls
  for; ENS adds a naming system Granite doesn't need).

## R4. Union-mount cache: TinkerPop via `gremlin` client

- **Decision**: Materialize the mounted view into any TinkerPop-compatible
  database reached over the Gremlin Server websocket protocol, using the
  `gremlin` JS client (same 3.7.x line as the sibling package). Dev and
  integration tests use Gremlin Server with in-memory TinkerGraph; the
  broader Mïmis deployment points the same code at JanusGraph. The cache is
  derived and disposable: `granite hydrate` rebuilds it from the DAG, new
  announcements invalidate affected publishers' subgraphs, and a cache-free
  reference resolver (`mount.ts`) defines correct semantics that the cached
  path must agree with (unit-tested equivalence).
- **Rationale**: Explicit user direction. Resolution without a cache costs
  one Kubo RPC round trip per path segment per mounted update; a graph
  database makes resolution and traversal single queries and gives the rest
  of the Mïmis ecosystem (which already speaks Gremlin against JanusGraph) a
  queryable view of Granite content.
- **Alternatives considered**: **No cache / direct DAG walks** (rejected:
  round-trip cost, no traversal queries); **in-process Map index** (fast but
  private to one process and un-queryable by other Mïmis tools); **SQLite**
  (adds a second query idiom to a workspace already standardized on Gremlin).

## R5. Announcements: Kubo Gossipsub topic + EIP-191 signatures

- **Decision**: Publish announcements on a single well-known Gossipsub topic
  (`/granite/1/announce`) through Kubo's pubsub RPC. Each announcement is a
  dag-cbor payload `{ publisher, root, prev, seq }` accompanied by an EIP-191
  `personal_sign` signature from the publisher's Ethereum key; subscribers
  verify with signature recovery and drop messages whose recovered address
  does not match `publisher`.
- **Rationale**: Reuses the two key systems already present (Kubo's gossipsub,
  the publisher's Ethereum account) — no extra key type, no extra transport.
  Signing makes announcements trustworthy even though gossipsub itself is
  unauthenticated; the registry remains the durable fallback when a node was
  offline (spec edge case: announcement/registry disagreement converges).
- **Alternatives considered**: **Per-publisher topics** (readers following N
  publishers hold N subscriptions; a single topic with signature filtering is
  simpler at v1 scale); **libp2p peer-key signing** (adds a second identity
  system, violating "each node should have its own publishing key" being the
  Ethereum key); **EIP-712 typed signatures** (nicer wallet UX but v1 signs
  programmatically; can upgrade later without protocol break by versioning
  the topic).

## R6. Language & test tooling: Node ≥ 24 native TS + `node:test`

- **Decision**: TypeScript ESM sources executed directly by Node ≥ 24 (native
  type-stripping) for dev, tests, and the CLI; `tsc` runs type-check and
  d.ts emission only. Tests use the built-in `node:test` runner. Package
  managed with pnpm within the existing workspace. Style per the project
  constitution: two-space indent, own-line trailing commas, throw on
  unexpected shapes.
- **Rationale**: Zero build/test dependencies (Principle I) while keeping the
  types the sibling packages expect from a workspace library.
- **Alternatives considered**: **vitest + tsx** (pleasant but two dev deps
  doing what the platform now does natively); **plain JS + JSDoc** (fewer
  tools but weaker contracts for library consumers, and the workspace is
  already TypeScript-tooled).

## R7. Publisher keys

- **Decision**: A publisher key is a plain secp256k1 Ethereum private key.
  v1 loads it from an environment variable or a key file path supplied via
  config; `granite keys generate` creates one. Rotation/recovery are out of
  scope (spec assumption). The Ethereum address derived from the key is the
  publisher identity everywhere (registry key, announcement signer).
- **Rationale**: One key, three uses (registry writes, announcement signing,
  identity) — the minimum that satisfies Principle V.
- **Alternatives considered**: **Keystore/JSON-wallet formats** (deferred —
  ceremony without a v1 threat model); **separate libp2p identity** (rejected
  in R5).
