/** A Spot’s path before & after a rename or a move. */
export interface Relocation {
  from: Array<string>
  to: Array<string>
}

const relocations = $state<{ latest: Relocation | null }>({ latest: null })
export default relocations

/** Records that what was at `from` is now at `to`, for every pane. */
export function relocate(relocation: Relocation) {
  relocations.latest = relocation
}

/** `path`, moved along with `from` if it’s at or below it. */
export function follow(path: Array<string>, { from, to }: Relocation) {
  const below = (
    from.length <= path.length && from.every((name, idx) => path[idx] === name)
  )
  return below ? [...to, ...path.slice(from.length)] : path
}
