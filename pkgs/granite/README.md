# Mïmis Granite

The most technologically incomplete version of Mïmis possible while still retaining the character.

A graph database formed of union mounts of linked trees promulgated using IPFS CBOR-DAGs.

## Architecture

A graph consists of a set of union mounted updates. Each node in an update is a separate IPFS document with the relationships containing the properties of the edge and a link to the CID of the child node.

Updates are identified by a root CID, and are published broadcast via libp2p Gossipsub and an Ethereum map. Each update contains a link to the most recently published previous update from that node.

Updates are **partial snapshots**: an update asserts only the paths it contains, and a publisher's effective graph is the union of their entire update chain, newest shadowing oldest. Published nodes may themselves declare **mounts** — unioning another subtree, another publisher's graph, or a spot *within* another publisher's graph (`{ source, path }`, live across their updates) beneath them — with the node's own relationships shadowing mounted content.

Each node should have its own publishing key. Multiple publishing nodes can be conglomerated through the union mounting system to form user directories.

Updates are all published relative to the same node — a universal root specific to each publishing key.

Reads resolve through the mount stack and are cached in any TinkerPop-compatible graph database (TinkerGraph in development, JanusGraph in the wider Mïmis deployment). The cache is derived and disposable — retrieval is incremental, fetching only the documents a query actually consults.

## Install

Requires Node ≥ 24 (`.node-version` pins it for fnm), pnpm, a [Kubo](https://github.com/ipfs/kubo) daemon (with pubsub), and an Ethereum RPC (anvil for development). A Gremlin Server is optional — without one, resolution walks the DAG directly.

`pnpm run dev` brings up a full development environment: anvil, Kubo, Gremlin Server (Docker), a freshly deployed registry, a funded dev key, and a ready-to-use `granite.dev.json` — starting only what isn't already running, and tearing down exactly what it started on Ctrl-C.

```console
$ pnpm install
$ pnpm link --global               # puts the `granite` bin on PATH
$ anvil &
$ pnpm run deploy:registry         # prints the registry address
$ cp granite.example.json granite.json   # fill in URLs + registry address
$ export GRANITE_KEY=$(granite keys generate --json | jq -r .key)
```

## CLI

```console
$ granite keys generate
$ granite publish tree.json
$ granite latest 0x…
$ granite resolve /books/dune --mount 0x… --mount bafy…
$ granite history 0x…
$ granite follow
$ granite hydrate --mount 0x… [--name alias]
$ granite spider ./docs [--out docs.car] [--include p]… [--exclude p]… [--yes]
$ granite load docs.car
```

Sources are Update CIDs or publisher addresses (⇒ their whole chain, newest shadowing oldest). `--json` emits machine-readable output; absence is success (`null`, exit 0).

`spider` walks a directory, offers an interactive tree selection (hidden and gitignored entries deselected by default; `--yes` skips the UI and takes the gitignore-syntax pattern selection as-is), imports the chosen files into Kubo, and writes a single CAR containing one complete unpublished update. `load` imports such an archive, validates the update and everything it references offline — failing loudly with the offender named — and never publishes, registers, or announces anything. Contracts: [specs/002-spider-car/contracts/](specs/002-spider-car/contracts/).

## Library

```ts
import { connect, generateKey, addressOf } from 'granite-mimis'

const granite = await connect({
  kubo: 'http://127.0.0.1:5001',
  gremlin: 'ws://127.0.0.1:8182/gremlin',
  chain: {
    rpcUrl: 'http://127.0.0.1:8545',
    registry: '0x…',
  },
  key: process.env.GRANITE_KEY,
})

const { update } = await granite.publish({
  edges: {
    books: {
      child: {
        edges: { dune: { child: { data: { author: 'Herbert' }, edges: {} } } },
      },
    },
  },
})

const stack = await granite.stack([{ source: update }])
const dune = await stack.resolve('/books/dune')   // { node, data, edges, via } | undefined
```

Full contracts live in [specs/001-granite-graph-core/contracts/](specs/001-granite-graph-core/contracts/).

## Tests

```console
$ pnpm test                # unit — in-memory fakes, no daemons
$ pnpm run test:integration   # live Kubo + anvil + Gremlin Server; suites skip when a daemon is absent
```
