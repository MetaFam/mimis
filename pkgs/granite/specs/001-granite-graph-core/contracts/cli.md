# Contract: `granite` CLI

Thin wrapper over the library API (one command ≈ one library call). Global
flags: `--config <path>` (JSON matching `GraniteConfig`; default
`./granite.json`, overridable per-field by `GRANITE_*` env vars, key via
`GRANITE_KEY` only). Output is human-readable by default; `--json` emits one
JSON document (or one per line for streaming commands). Exit 0 on success,
1 on error (message on stderr), 2 on usage error. "Not present" results are
success (exit 0) with an empty/`null` payload — absence is not an error.

## Commands

### `granite keys generate`

Prints a new private key and its address. Never writes files.

```console
$ granite keys generate --json
{ "key": "0x…", "address": "0x…" }
```

### `granite publish <tree.json>`

Reads a `Tree` (per library-api.md) from the file (`-` = stdin); publishes,
registers, announces.

```console
$ granite publish tree.json --json
{ "update": "bafy…", "root": "bafy…", "prev": "bafy…" }
```

`prev` omitted on a publisher's first update.

### `granite latest <address>`

Registry lookup. Prints the Update CID, or nothing (`null` with `--json`)
if the address never published.

### `granite resolve <path> --mount <source>…`

Resolves `path` through the stack formed by the `--mount` flags in the order
given (later flags shadow earlier). Each `<source>` is an Update CID or a
publisher address (⇒ latest). Uses the cache when configured.

```console
$ granite resolve /books/dune --mount 0xAAA… --mount bafy… --json
{ "node": "bafy…", "data": { … }, "edges": { … }, "via": "bafy…" }
```

Not-present prints `null` (exit 0). Unreachable/malformed documents exit 1
with the offending CID on stderr.

### `granite history <address|update-cid>`

Walks the prev-chain newest→oldest, one line per update (streaming with
`--json`). Broken chain: emits what it reached, then exits 1 naming the
unreachable CID.

### `granite follow`

Subscribes to verified announcements and streams them until interrupted.

```console
$ granite follow --json
{ "publisher": "0x…", "root": "bafy…", "prev": "bafy…", "at": 1750000000 }
…
```

### `granite hydrate --stack <name> --mount <source>…`

Materializes the stack into the configured cache (rebuild-from-DAG; safe to
run anytime — the Constitution IV disposability guarantee). Errors if no
`gremlin` endpoint is configured.

## Contract tests

Each command has an integration test asserting: exit code, `--json` shape,
and the not-present-is-success rule for `latest`/`resolve`.
