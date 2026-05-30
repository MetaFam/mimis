/** POSIX-style path helpers. Paths are absolute and use `/` separators. */

export const ROOT = '/'

/** Split an absolute path into its non-empty segments. `/a/b` -> ['a','b']. */
export function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/** Join a base directory with a child name into a normalised absolute path. */
export function join(base: string, name: string): string {
  if (base === ROOT) return ROOT + name
  return `${base}/${name}`
}

/** The parent directory of a path. The parent of root is root. */
export function dirname(path: string): string {
  const segs = segments(path)
  segs.pop()
  return segs.length ? ROOT + segs.join('/') : ROOT
}

/** The final segment of a path. The basename of root is empty. */
export function basename(path: string): string {
  const segs = segments(path)
  return segs[segs.length - 1] ?? ''
}

/** Normalise a path: collapse duplicate slashes and strip a trailing slash. */
export function normalize(path: string): string {
  const segs = segments(path)
  return segs.length ? ROOT + segs.join('/') : ROOT
}

/** True when `ancestor` is the same as or a parent directory of `path`. */
export function isAncestor(ancestor: string, path: string): boolean {
  if (ancestor === path) return true
  const a = normalize(ancestor)
  return a === ROOT ? true : path.startsWith(a + '/')
}

/** Build the chain of ancestor paths from root to `path`, inclusive. */
export function ancestry(path: string): string[] {
  const segs = segments(path)
  const chain: string[] = [ROOT]
  let acc = ''
  for (const seg of segs) {
    acc += '/' + seg
    chain.push(acc)
  }
  return chain
}
