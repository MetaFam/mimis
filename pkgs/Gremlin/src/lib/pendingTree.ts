import type { PendingSpot } from '#lib/remotes/pending.remote.js'

/** Rows with more pending Spots inside than this open folded (FR-009). */
export const FOLD_OVER = 50

/** A pending Spot, or a context row for a path with none, & its rows. */
export interface Row {
  /** The path’s last segment; `''` for the root. */
  name: string
  path: Array<string>
  /** Absent for a context row. */
  spot?: PendingSpot
  /** Rows with a `spot` strictly inside this one. */
  pending: number
  children: Array<Row>
}

/**
 * `spots` nested by path. Siblings keep the order they’re given, which
 * from `pending()` is already path order, so nothing is sorted here.
 */
export function nest(spots: Array<PendingSpot>): Array<Row> {
  const top: Array<Row> = []
  const rows = new Map<string, Row>()
  const rowAt = (path: Array<string>): Row => {
    const key = JSON.stringify(path)
    let row = rows.get(key)
    if(!row) {
      row = { name: path.at(-1)!, path, pending: 0, children: [] }
      rows.set(key, row)
      ;(path.length === 1 ? top : rowAt(path.slice(0, -1)).children).push(row)
    }
    return row
  }
  const root = spots.find(({ path }) => path.length === 0)
  for(const spot of spots) {
    if(spot === root) continue
    rowAt(spot.path).spot = spot
    for(let depth = 1; depth < spot.path.length; depth++) {
      rowAt(spot.path.slice(0, depth)).pending++
    }
  }
  return root ? [{
    name: '', path: [], spot: root, pending: spots.length - 1, children: top,
  }] : top
}
