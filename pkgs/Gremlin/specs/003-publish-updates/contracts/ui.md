# Contract: UI

## Actions menu (`src/routes/[...path]/+page.svelte`)

- “Export to CAR” and “Export to CBOR-DAG” are removed, and so are `buildDAG`, `buildCAR`, and `build`. “Export to CSV” stays.
- A new **“Publish…”** button (`commandfor="publish"`, `command="show-modal"`) is disabled without a session, like “Add Directory”.
- A new **“Record Update”** form has one text input (`aria-label="Update address"`) and a submit button. It calls `receiveUpdate({ cid })`, then shows “Recorded Update 4 from 0xa11… (device d7…).” or “Already recorded.” in the log dialog. Errors go to `ErrorDialog`.

## `PublishDialog.svelte` (`src/lib/components/`)

**Props**: `{ me: string | null }`, the session address from `SIWE`.

**Layout**, inside `<dialog id="publish">`:

| Region | Contents |
| --- | --- |
| `<section aria-label="Staged">` | a heading, then a list of `PendingSpot`s. Each row is a checkbox (checked) labelled by the path, joined with `/` and with a trailing `/`, and a summary: “new” or “+a −r”. |
| `<section aria-label="Not staged">` | the same, unchecked |
| buttons | “Stage all”, and “Publish” (the dialog's primary action) |
| `<label>` | “Comment (optional, unsigned)” `<input name="comment">` |
| `<output aria-live="polite">` | status, as below |

**States**:

| State | Shown |
| --- | --- |
| loading `pending()` | a spinner (`#assets/spinner.svg`) |
| no session or wallet | “Connect a wallet to publish.”, with Publish disabled |
| nothing staged | Publish enabled. Pressing it calls `preparePublish`, which returns `nothing: true`, and shows “Nothing is staged to publish.” The wallet isn't asked. |
| wallet ≠ session | “Your wallet is connected as 0x…, but you’re signed in as 0x….”, and nothing is called (FR-007) |
| prepared | “Also included so the staged Spots stay connected:” and the `included` paths, then “Waiting for your wallet…” |
| signature declined | “Publish cancelled. Your changes are still pending.” |
| committed | “Published Update 3: <a href={toHTTP({ cid })}>bafy…</a>” and “Comment: hats (yours, unsigned)” when given. Then it refreshes `pending()` and `listing()`. |
| error | the remote's message, with Publish enabled again |

**Behavior**:

- Toggling a checkbox calls `stage({ ids: [id], staged })`, and “Stage all” calls `stage({ all: true })`. The lists come from `pending()`, which those commands refresh.
- Publish is disabled from the moment it's pressed until a terminal state, so one tab can't start two publishes at once.

## Tests

| File | Covers |
| --- | --- |
| `src/lib/components/PublishDialog.svelte.test.ts` | every state above, with the remotes and `signTypedData` mocked; the account check; that a declined signature calls no commit |
| `src/routes/[...path]/page.svelte.test.ts` | the menu has “Publish…” and “Record Update”, and no longer has the CAR or DAG exports |
