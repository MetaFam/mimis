# Contract: UI

## `RenameDialog.svelte` (new)

| Prop | Type | Meaning |
| --- | --- | --- |
| `path` | `Array<string>` | The parent's view path |
| `name` | `string` | The current name, preselected in the input |
| `onrenamed` | `(to: Array<string>) => void` | Called with the new full path after success |
| `onerror` | `(msg: string) => void` | Called with a refusal's message (FR-010) |

- It is a modal `<dialog>` with one text input and the buttons **Rename** and **Cancel**.
- On every input, `validName()` runs. The input's custom validity is set to the reason, which is shown under it, and **Rename** is disabled (FR-007).
- Cancel, Escape, or a click outside closes it without a call (FR-008). Confirming the unchanged name closes it without a call.
- On success it calls `relocate({ from: [...path, name], to })` and refreshes `listing({ path })`.

## `FileBrowser.svelte`

- The context menu gains **Rename “name”…**, shown when the user is signed in (FR-009), for tiles in the icon view and rows in the table view. It opens `RenameDialog`.
- A tile or row whose `Child.moved` is set gets the class `moved` and a ⚠ badge titled "Moved by its owner". Its context menu gains **Resolve move…**, which opens `NoticesDialog` focused on that mount.
- **Delete** on a tile backed by the user's own link `MOUNT` removes the rename, so the lower name shows again.

## `Breadcrumbs.svelte`

- Each crumb except the root gets a rename control, a ✎ button shown on hover or focus while signed in, which opens `RenameDialog` with the crumb's parent path and name (FR-002).
- After a rename, `relocate()` moves every pane under the old path (FR-016).

## `NoticesDialog.svelte` (new)

- The actions menu gains **Moved links (n)**, shown when `notices()` is non-empty, which opens the dialog.
- The dialog lists each notice as "*owner* moved “*name*” from /*from*/ to /*to*/". When `to` is `null`, it reads "to /*ownerPath*/ in their tree".
- Each notice has three buttons (FR-023):
  - **Remove my rename**
  - **Follow to /*to*/**, disabled with a title when `to` is `null`
  - **Keep here as mine**
- After each one, the dialog refreshes `notices()` and the affected listings, and calls `relocate()` with the returned paths. Errors go to `onerror`.

## `FileView.svelte`

There's an `$effect`: when `relocations.latest` covers this pane's `path`, `path` becomes `follow(path, latest)`.
