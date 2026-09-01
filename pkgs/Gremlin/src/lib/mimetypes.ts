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