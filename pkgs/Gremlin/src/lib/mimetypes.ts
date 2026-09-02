export const mimetypes: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  md: 'text/markdown',
  txt: 'text/plain',
  json: 'application/json',
  html: 'text/html',
  css: 'text/css',
  // Resolved in favor of TypeScript over MPEG transport stream,
  // for which the registered type is `video/mp2t`.
  ts: 'text/typescript',
}

export function mimeFor(extension?: string | null) {
  if(extension == null) return null
  return mimetypes[extension.toLowerCase()] ?? null
}

/** First extension listed for each MIME type wins (e.g. jpg over jpeg). */
const extensions: Record<string, string> = {}
for(const [ext, type] of Object.entries(mimetypes)) {
  extensions[type] ??= ext
}

export function extFor(type?: string | null) {
  if(type == null) return null
  return (
    extensions[type]
    ?? type.match(/;extension=([^;]+)/)?.[1]
    ?? null
  )
}

/**
 * Split a filename the way `addFiles` does: `title.ext`, with
 * extensionless names yielding a `null` extension.
 */
export function splitName(name: string) {
  const [, title, ext] = (
    name.match(/^(.+)\.([^.]+)$/) ?? [null, name, null]
  )
  return { title, ext }
}

/** The MIME type `addFiles` records for a filename with no declared type. */
export function typeForName(name: string) {
  const { ext } = splitName(name)
  return mimeFor(ext) ?? `application/octet-stream;extension=${ext ?? '𝘶𝘯𝘬𝘯𝘰𝘸𝘯'}`
}

/** Reassemble a filename from a Spot title & representation MIME type. */
export function nameFor({ title, type }: { title: string, type: string }) {
  const ext = extFor(type)
  return ext == null ? title : `${title}.${ext}`
}

const displayable = new Set([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
])

export function viewable(type?: string | null) {
  return displayable.has(type ?? '')
}