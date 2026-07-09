# Contract: `granite spider` & `granite load`

Extends the feature-001 CLI contract (same config resolution, `--json`, exit-code conventions: 0 success, 1 error, 2 usage).

## `granite spider <dir> [--out <file.car>] [--include <pattern>]… [--exclude <pattern>]… [--yes]`

Walks `<dir>`, presents the selection UI (or applies patterns with `--yes`), imports the selection, and writes a CAR containing one complete unpublished Update.

- Requires a publishing key (`GRANITE_KEY`) — updates carry `publisher`; missing key ⇒ exit 1 with `MissingKeyError`'s message.
- Requires a reachable Kubo daemon (UnixFS import + `dag export`).
- `--out` defaults to `<dirname>-<short-update-cid>.car` in the working directory; the file is written to a temporary name and renamed on completion (no valid-named partial archives).
- `--include`/`--exclude` take gitignore-syntax patterns (evaluated in order, exclude wins on ties); with `--yes` no UI is shown and the computed selection is used as-is. Patterns without `--yes` pre-seed the UI.
- An empty computed selection with `--yes` ⇒ exit 1 (never an empty archive); in the UI, confirmation is refused while nothing is selected.
- Registry unreachable at generation ⇒ proceed chainless, print a warning to stderr (exit still 0).

```console
$ granite spider ./docs --exclude '*.tmp' --yes --json
{ "car": "docs-bafyreig7.car", "update": "bafy…", "root": "bafy…", "files": 42, "bytes": 1048576 }
```

Human output additionally lists warnings (unreadable entries, chainless generation).

### Selection UI keys

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move cursor |
| → / ← | Expand / collapse directory |
| space | Toggle entry (directories toggle their subtree) |
| h | Show/hide default-excluded (hidden/ignored) entries |
| enter | Confirm (refused while selection is empty) |
| q / ctrl-c | Abort — no archive written, exit 1 |

On-screen hint line shows exactly these bindings (SC-006).

## `granite load <file.car>`

Imports the archive into the local database and validates it; strictly local (FR-010).

- Requires a reachable Kubo daemon. Uses the cache to note the update when a Gremlin endpoint is configured; absence of one is not an error.
- Validation failure (missing block, malformed document, wrong root count, root that is not a granite Update) ⇒ exit 1, offender named on stderr, nothing reported as loaded.
- Idempotent: loading twice succeeds and changes nothing (exit 0 both times).

```console
$ granite load docs-bafyreig7.car --json
{ "update": "bafy…", "root": "bafy…", "publisher": "0x…", "prev": "bafy…", "blocks": 128 }
```

`prev` omitted when the update is chainless. After a successful load, `granite resolve --mount <update-cid> /path/to/file` resolves archived content (see quickstart).

## Contract tests

1. `spider --yes` with patterns: exit codes, `--json` shape, empty-selection error, `.car` produced with one root.
2. `load`: valid archive round trip; truncated archive ⇒ exit 1 naming the missing CID; non-CAR file ⇒ exit 1; double load ⇒ exit 0, no growth.
3. Key-less `spider` ⇒ exit 1; registry-less `spider` ⇒ exit 0 + warning, chainless update.
