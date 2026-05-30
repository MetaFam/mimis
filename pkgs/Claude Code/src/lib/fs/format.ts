/** Presentation helpers for sizes and timestamps. */

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

/** Format a byte count the way Dolphin's status bar does, e.g. `1.4 MiB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1) return '0 B'
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / 1024 ** exp
  const decimals = exp === 0 ? 0 : value < 10 ? 1 : 0
  return `${value.toFixed(decimals)} ${UNITS[exp]}`
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** Format an epoch-ms timestamp for the details view and info panel. */
export function formatDate(epochMs: number): string {
  return dateFmt.format(new Date(epochMs))
}

/** A coarse, human relative time such as `today` or `3 days ago`. */
export function relativeDate(epochMs: number, now = Date.now()): string {
  const days = Math.floor((now - epochMs) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

/** Pluralise a count with a unit, e.g. `pluralize(3, 'item')` -> `3 items`. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}
