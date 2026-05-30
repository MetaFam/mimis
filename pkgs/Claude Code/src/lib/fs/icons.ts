/** Maps filesystem entries to a glyph, accent colour, and MIME type. */

import type { FsNode } from './types'

export interface IconSpec {
  /** Emoji or symbol rendered as the entry's icon. */
  glyph: string
  /** Accent colour used for tinting and the info panel. */
  color: string
  /** Broad category label shown in the details view's "Type" column. */
  category: string
  mime: string
}

interface ExtSpec extends IconSpec {
  exts: string[]
}

const TABLE: ExtSpec[] = [
  { glyph: '🖼️', color: '#16a085', category: 'Image', mime: 'image/*', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic'] },
  { glyph: '🎬', color: '#8e44ad', category: 'Video', mime: 'video/*', exts: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'm4v'] },
  { glyph: '🎵', color: '#2980b9', category: 'Audio', mime: 'audio/*', exts: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'opus'] },
  { glyph: '📕', color: '#c0392b', category: 'Document', mime: 'application/pdf', exts: ['pdf'] },
  { glyph: '📄', color: '#2c3e50', category: 'Text', mime: 'text/plain', exts: ['txt', 'md', 'rst', 'log', 'nfo'] },
  { glyph: '📝', color: '#2b579a', category: 'Document', mime: 'application/msword', exts: ['doc', 'docx', 'odt', 'rtf'] },
  { glyph: '📊', color: '#217346', category: 'Spreadsheet', mime: 'application/vnd.ms-excel', exts: ['xls', 'xlsx', 'ods', 'csv'] },
  { glyph: '📈', color: '#d24726', category: 'Presentation', mime: 'application/vnd.ms-powerpoint', exts: ['ppt', 'pptx', 'odp'] },
  { glyph: '🗜️', color: '#e67e22', category: 'Archive', mime: 'application/zip', exts: ['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'zst'] },
  { glyph: '⚙️', color: '#7f8c8d', category: 'Executable', mime: 'application/x-executable', exts: ['exe', 'appimage', 'bin', 'run', 'sh', 'bat'] },
  { glyph: '💻', color: '#f39c12', category: 'Source', mime: 'text/x-source', exts: ['js', 'ts', 'jsx', 'tsx', 'svelte', 'vue', 'py', 'rs', 'go', 'c', 'cpp', 'h', 'java', 'rb', 'php', 'css', 'html', 'json', 'yaml', 'yml', 'toml', 'xml'] },
  { glyph: '🔤', color: '#34495e', category: 'Font', mime: 'font/ttf', exts: ['ttf', 'otf', 'woff', 'woff2'] },
]

const BY_EXT = new Map<string, ExtSpec>()
for (const spec of TABLE) for (const ext of spec.exts) BY_EXT.set(ext, spec)

const FOLDER: IconSpec = { glyph: '📁', color: '#3daee9', category: 'Folder', mime: 'inode/directory' }
const GENERIC: IconSpec = { glyph: '📄', color: '#7f8c8d', category: 'File', mime: 'application/octet-stream' }

/** Extract the lowercase extension of a filename, or '' when there is none. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** Resolve the icon specification for a filesystem node. */
export function iconFor(node: FsNode): IconSpec {
  if (node.kind === 'folder') return FOLDER
  const spec = BY_EXT.get(extensionOf(node.name))
  if (!spec) return GENERIC
  return { glyph: spec.glyph, color: spec.color, category: spec.category, mime: spec.mime }
}
