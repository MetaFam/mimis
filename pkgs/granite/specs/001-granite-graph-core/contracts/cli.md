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
publisher address (⇒ their entire update chain, newest shadowing oldest).
Published node mounts are honored during the walk (FR-014). Uses the cache
when configured: the stack is identified by a key derived from the ordered
mount list (cache-schema.md), so repeated invocations with the same mounts
hit the same hydrated stack without naming it.

```console
$ granite resolve /books/dune --mount 0xAAA… --mount bafy… --json
{ "node": "bafy…", "data": { … }, "edges": { … }, "via": "bafy…" }
```

Not-present prints `null` (exit 0). Unreachable/malformed documents exit 1
with the offending CID on stderr.

### `granite history <address|update-cid>`

Walks the prev-chain newest→oldest, one line per update (streaming with
`--json`). Broken chain: emits what it reached, then exits 1 naming the
unreachable CID. A never-published address emits nothing and exits 0 —
absence is not an error.

### `granite follow`

Subscribes to verified announcements and streams them until interrupted.

```console
$ granite follow --json
{ "publisher": "0x…", "root": "bafy…", "prev": "bafy…", "at": 1750000000 }
…
```

### `granite hydrate --mount <source>… [--name <alias>]`

Eagerly materializes the whole stack into the configured cache — an optional
warm-up for traversal-style queries; `resolve` hydrates lazily on its own,
fetching only path-relevant documents (FR-015). Rebuild-from-DAG, safe to
run anytime — the Constitution IV disposability guarantee. The stack's
identity is the key derived from the ordered mounts; `--name` attaches an
optional human-readable alias. Errors if no `gremlin` endpoint is configured.

## Contract tests

Each command has an integration test asserting: exit code, `--json` shape,
and the not-present-is-success rule for `latest`/`resolve`.
