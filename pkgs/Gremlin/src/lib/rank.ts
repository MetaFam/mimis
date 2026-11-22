const byUuid = (a: { uuid: string }, b: { uuid: string }) => (
  a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0
)

/**
 * A Spot’s Contents in rank order, each following the one it names as
 * `after`. Any list, even a damaged one, has one order: those with no
 * predecessor held come first, those following the same one are by
 * uuid, & those left over in a loop come last, by uuid.
 */
export function rank<T extends { uuid: string, after?: string }>(
  items: Array<T>,
) {
  const held = new Set(items.map(({ uuid }) => uuid))
  const followers = new Map<string | undefined, Array<T>>()
  for(const item of items) {
    const at = item.after != null && held.has(item.after) ? item.after : undefined
    if(!followers.has(at)) followers.set(at, [])
    followers.get(at)!.push(item)
  }
  for(const group of followers.values()) group.sort(byUuid)

  const ranked: Array<T> = []
  const placed = new Set<string>()
  const stack = [...(followers.get(undefined) ?? [])].reverse()
  while(stack.length > 0) {
    const item = stack.pop()!
    if(placed.has(item.uuid)) continue
    placed.add(item.uuid)
    ranked.push(item)
    stack.push(...[...(followers.get(item.uuid) ?? [])].reverse())
  }
  ranked.push(...items.filter(({ uuid }) => !placed.has(uuid)).sort(byUuid))
  return ranked
}

/** What each of `ranked` must name as `after` to keep that order. */
export const predecessors = <T extends { uuid: string }>(ranked: Array<T>) => (
  ranked.map((item, idx) => ({ item, after: ranked[idx - 1]?.uuid }))
)
