/** Position and target of the right-click context menu. */

class ContextMenuStore {
  open = $state(false)
  x = $state(0)
  y = $state(0)
  /** Path that was right-clicked, or `null` for the empty view background. */
  target = $state<string | null>(null)

  show(x: number, y: number, target: string | null) {
    this.x = x
    this.y = y
    this.target = target
    this.open = true
  }

  hide() {
    this.open = false
  }
}

export const contextMenu = new ContextMenuStore()
