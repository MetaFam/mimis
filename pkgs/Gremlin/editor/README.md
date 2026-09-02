# mimis-fs — Mïmis in VS Code Web

A web extension mounting a Mïmis tree as an editable workspace: Spots are directories, current representations are files. Saves upload bytes to IPFS immediately (unpinned) & stage; the Mïmis view in Source Control commits staged changes to the graph, creating new `File` vertices with `PREVIOUS` edges to the versions they supersede, & pinning the committed CIDs.

## Running

```bash
pnpm run editor:build   # from the repo root: installs & bundles dist/extension.js
docker compose up openvscode
```

The extension directory is bind-mounted into the container’s extension folder, & the editor serves at http://localhost:33333.

## Opening a tree

Right-click (or long-press) an item in the app’s file browser → “Edit … in VS Code”. Signed in, that opens `http://localhost:33333/?folder=mimis:/<path>?code=<code>`, & pairing happens on its own: `code` is a single-use, minute-long credential from `/api/auth/code`, which the extension trades at `POST /api/auth/token` for a session token.

The query is the only part of the opening URL a web extension can read — the extension host is a worker with no `window.location` — which is why the code rides on the folder URI rather than beside it. It stays in the URL afterwards, spent & inert; reloading such a URL replays a dead code, which the extension ignores once it holds a token.

If the `folder` parameter doesn’t take (it depends on openvscode-server accepting custom-scheme workspace URIs), run “Mïmis: Open Path” inside the editor instead.

## Pairing by hand

When the automatic handoff doesn’t happen — “Mïmis: Open Path”, or a code that expired before the editor loaded:

1. In the Mïmis app, sign in & choose “Copy Editor Token” from the actions menu.
2. In VS Code, run “Mïmis: Set Token” & paste.

Either way the token is the same HMAC-signed, week-long session the cookie carries, sent as `Authorization: Bearer` to `/api/fs` (CORS-allowed for `PUBLIC_EDITOR_URL`, default `http://localhost:33333`).

## Where state lives

Both the token & the staged-change map live in `globalState`, not in `context.secrets` or `workspaceState`:

- VS Code for the Web keeps secret storage **in memory** unless the host supplies a `secretStorageProvider`, & openvscode-server supplies none — a token stored there is gone on the next reload.
- A folder opened with a pairing code is a different workspace, to VS Code, than the same folder opened without one, so `workspaceState` would scatter staged changes across near-identical identities. Staged keys are absolute paths in the Mïmis tree, so they don’t collide globally.

In the web that means the browser’s IndexedDB for the editor’s origin: per-browser, & in the clear. Fine for a localhost editor; think twice before exposing one publicly.

## “Workspace does not exist”

That dialog means VS Code called `stat` on the workspace folder & the extension couldn’t answer — it is unpaired, or its token has expired. It fires from a startup check that runs before any extension loads, so it reflects authorization, not a missing path. Pair (or re-pair) & reload.

## Settings

- `mimis.apiURL` — base URL of the app serving `/api/fs` (default `http://localhost:5173`)
- `mimis.commitMode` — `explicit` (default: saves stage until commit) or `onSave` (write through to the graph)

Deletion is intentionally unsupported — the graph is append-only.
