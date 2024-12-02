import ignore from 'ignore'

export type Node = DirNode | FileNode

export type DirNode = {
	type: 'directory'
	title: string
	children: Array<Node>
	handle?: FileSystemDirectoryHandle
	cid?: string
	childCount: number
	selected?: boolean
	size: number
}

export type FileNode = {
	type: 'file'
	title: string
	handle?: FileSystemFileHandle
	cid?: string
	selected?: boolean
	size: number
}

export type GitIgnore = {
	ig: ReturnType<typeof ignore>
	path: string
}
