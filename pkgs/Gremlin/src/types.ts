import ignore from 'ignore'

export type Node = DirNode | FileNode

export type NodeCommons = {
	title: string
	cid?: string
	selected?: boolean
	size: number
	expanded?: boolean
	path?: string
}

export type DirNode = NodeCommons & {
	type: 'directory'
	handle?: FileSystemDirectoryHandle
	children: Array<Node>
	childCount: number
}

export type FileNode = NodeCommons & {
	type: 'file'
	handle?: FileSystemFileHandle
	file?: File
	childCount: 0
}

export type GitIgnore = {
	ig: ReturnType<typeof ignore>
	path: string
}

export type Logger = ((msg: unknown) => void) | null
