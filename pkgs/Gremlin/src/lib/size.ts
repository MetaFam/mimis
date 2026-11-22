const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB']

/** `bytes` for people: whole bytes, else one decimal in binary units. */
export function sizeOf(bytes: number) {
  let n = bytes
  let unit = 0
  while(n >= 1024 && unit < UNITS.length - 1) {
    n /= 1024
    unit++
  }
  return `${unit === 0 ? n : n.toFixed(1)} ${UNITS[unit]}`
}
