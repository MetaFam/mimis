/** Shared pointer/keyboard interaction logic for the three file views.
 *
 * Centralised so IconsView, CompactView, and DetailsView behave identically. */

import { commands, contextMenu, selection } from '$lib/state'

/** Click on an entry: plain replaces, Ctrl toggles, Shift extends a range. */
export function selectOnClick(event: MouseEvent, path: string, ordered: string[]) {
  if (event.ctrlKey || event.metaKey) {
    selection.toggle(path)
  } else if (event.shiftKey) {
    selection.range(path, ordered)
  } else {
    selection.select(path)
  }
}

/** Double-click (or Enter) opens folders and activates files. */
export function activate(path: string) {
  commands.open(path)
}

/** Right-click: ensure the target is selected, then open the context menu. */
export function openEntryMenu(event: MouseEvent, path: string) {
  event.preventDefault()
  event.stopPropagation()
  if (!selection.has(path)) selection.select(path)
  contextMenu.show(event.clientX, event.clientY, path)
}

/** Right-click on empty space: clear selection and open the background menu. */
export function openBackgroundMenu(event: MouseEvent) {
  event.preventDefault()
  selection.clear()
  contextMenu.show(event.clientX, event.clientY, null)
}
