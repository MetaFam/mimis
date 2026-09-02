# mimis-fs — Mïmis in VS Code Web

A web extension mounting a Mïmis tree as an editable workspace: Spots are directories, current representations are files. Saves upload bytes to IPFS immediately (unpinned) & stage; the Mïmis view in Source Control commits staged changes to the graph, creating new `File` vertices with `PREVIOUS` edges to the versions they supersede, & pinning the committed CIDs.

## Running

```bash
pnpm run editor:build   # from the repo root: installs & bundles dist/extension.js
docker compose up openvscode
```

The extension directory is bind-mounted into the container’s extension folder, & the editor serves at http://localhost:33333.

## Pairing

1. In the Mïmis app, sign in & choose “Copy Editor Token” from the actions menu.
2. In VS Code, run “Mïmis: Set Token” & paste.

The token is the same HMAC-signed session the cookie carries, sent as `Authorization: Bearer` to `/api/fs` (CORS-allowed for `PUBLIC_EDITOR_URL`, default `http://localhost:33333`).

## Opening a tree

Right-click (or long-press) an item in the app’s file browser → “Edit … in VS Code”, which opens `http://localhost:33333/?folder=mimis:/<path>`. If the `folder` query parameter doesn’t take (it depends on openvscode-server accepting custom-scheme workspace URIs), run “Mïmis: Open Path” inside the editor instead.

## Settings

- `mimis.apiURL` — base URL of the app serving `/api/fs` (default `http://localhost:5173`)
- `mimis.commitMode` — `explicit` (default: saves stage until commit) or `onSave` (write through to the graph)

Deletion is intentionally unsupported — the graph is append-only.
