/** Core data model for the virtual filesystem that backs the file manager. */

export type NodeKind = 'folder' | 'file'

export interface FsNode {
  /** Bare name of the entry, e.g. `report.pdf` (never a full path). */
  name: string
  kind: NodeKind
  /** Size in bytes. Folders report the recursive size of their contents. */
  size: number
  /** Last-modified time as epoch milliseconds. */
  modified: number
  /** Present only on folders. */
  children?: FsNode[]
  /** Dotfiles and other entries hidden unless "show hidden" is enabled. */
  hidden?: boolean
  /** MIME type, used for icon selection and the info panel. */
  mime?: string
}

/** A node together with the absolute path at which it lives. */
export interface ResolvedNode {
  path: string
  node: FsNode
}

export type SortKey = 'name' | 'size' | 'modified' | 'kind'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'icons' | 'compact' | 'details'
