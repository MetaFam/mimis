import ignore from 'ignore'

export type Node = {
	type: 'file' | 'directory'
	title: string
	children?: Array<Node>
	handle?: FileSystemFileHandle
	cid?: string
}

export type GitIgnore = {
	ig: ReturnType<typeof ignore>
	path: string
}
