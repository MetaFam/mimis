# Quickstart: Granite Core Graph

Validation guide — proves the feature end-to-end against the spec's success
criteria. Interfaces referenced here are defined in
[contracts/](./contracts/); document shapes in [data-model.md](./data-model.md).

## Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| Node.js ≥ 24 | runs TS directly; `node:test` | `node --version` |
| pnpm | workspace package manager | `pnpm --version` |
| Kubo (IPFS) daemon with pubsub | block store + Gossipsub | `ipfs daemon` running; `curl -X POST 127.0.0.1:5001/api/v0/version` |
| Gremlin Server (TinkerGraph) | union-mount cache | ws://127.0.0.1:8182 reachable (e.g. `docker run -p 8182:8182 tinkerpop/gremlin-server`) |
| anvil (foundry) + solc ≥ 0.8.24 | local chain + registry compile | `anvil --version`, `solc --version` |

## Setup

```console
$ pnpm install
$ pnpm link --global                       # puts the `granite` bin on PATH
$ anvil &                                  # local chain on :8545
$ pnpm run deploy:registry                 # compiles GraniteRegistry.sol, deploys to anvil, prints address
$ cp granite.example.json granite.json     # fill in kubo/gremlin/rpc URLs + registry address
$ export GRANITE_KEY=$(granite keys generate --json | jq -r .key)
```

## Automated validation

```console
$ pnpm test              # unit: codec shapes, mount semantics, cache/DAG agreement, history
$ pnpm test:integration  # requires Kubo + anvil + Gremlin Server running
```

Integration suite covers the four user stories in order; all must pass.

## Manual walkthrough (maps to spec user stories)

### US1 — publish (SC-002, SC-005)

```console
$ granite publish tree.json --json         # one command: IPFS + registry + announcement
{ "update": "bafy…", "root": "bafy…" }
$ granite publish tree2.json --json        # second publish chains prev
{ "update": "bafy…", "root": "bafy…", "prev": "bafy…" }
$ ipfs dag get <first-update-cid>          # first update still retrievable, unchanged
```

**Expect**: second result's `prev` = first result's `update`; first update's
content unchanged after the second publish.

### US2 — union-mount reads (SC-004)

```console
$ granite resolve /path/redefined --mount <update1> --mount <update2> --json
$ granite resolve /path/only-in-first --mount <update1> --mount <update2> --json
$ granite resolve /path/nowhere --mount <update1> --mount <update2> --json
```

**Expect**: later mount's value; earlier mount's value (fall-through); `null`
with exit 0 (definitive not-present). Re-running any of them returns
identical results.

### US3 — discovery (SC-001, SC-003, SC-006)

```console
$ granite follow --json &                  # subscriber
$ granite publish tree3.json               # publisher (other terminal/machine)
$ granite latest <address> --json          # registry agrees once mined
$ granite history <address> --json         # walks prev-chain to the first update
```

**Expect**: `follow` prints the verified announcement within 60 s of publish;
`latest` returns the same root; `history` streams every update back to the
chain start.

### US4 — directories (multi-publisher mounts)

```console
$ granite resolve /shared/path --mount 0xAAA… --mount 0xBBB… --json
```

**Expect**: paths unique to either publisher resolve; contested paths go to
the later mount (0xBBB…).

### Cache disposability (Constitution IV check)

```console
$ granite hydrate --name demo --mount 0xAAA… --mount 0xBBB…
# drop the Gremlin graph (e.g. restart TinkerGraph server), then:
$ granite resolve /shared/path --mount 0xAAA… --mount 0xBBB… --json   # still correct (DAG fall-back)
$ granite hydrate --name demo --mount 0xAAA… --mount 0xBBB…           # full rebuild succeeds
```

**Expect**: identical resolution results with the cache cold, warm, or wiped.
