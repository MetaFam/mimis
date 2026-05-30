/** View settings: layout mode, sorting, zoom, and which panels are visible. */

import type { SortKey, ViewMode } from '$lib/fs'

/** Icon-size bounds for the zoom slider, in pixels. */
export const MIN_ZOOM = 32
export const MAX_ZOOM = 192

class ViewStore {
  mode = $state<ViewMode>('icons')
  sortKey = $state<SortKey>('name')
  sortDir = $state<'asc' | 'desc'>('asc')
  /** Icon edge length in pixels, driven by the status-bar zoom slider. */
  iconSize = $state(80)
  showHidden = $state(false)
  foldersFirst = $state(true)
  /** Side and detail panels. */
  showPlaces = $state(true)
  showInfo = $state(false)

  setMode(mode: ViewMode) {
    this.mode = mode
  }

  /** Sort by `key`, toggling direction when the key is already active. */
  sortBy(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortKey = key
      this.sortDir = 'asc'
    }
  }

  zoom(delta: number) {
    this.iconSize = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.iconSize + delta))
  }

  toggleHidden() {
    this.showHidden = !this.showHidden
  }

  togglePlaces() {
    this.showPlaces = !this.showPlaces
  }

  toggleInfo() {
    this.showInfo = !this.showInfo
  }
}

export const view = new ViewStore()
