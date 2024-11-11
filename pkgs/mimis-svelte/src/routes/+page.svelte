<script lang="ts" module>
	import { Wunderbaum } from 'wunderbaum'
	import ignore from 'ignore'
	import 'wunderbaum/dist/wunderbaum.css'
	import 'bootstrap-icons/font/bootstrap-icons.css'
	import Content from './Content.svelte'

	type Node = {
		type: 'file' | 'directory'
		title: string
		children?: Array<Node>
		handle?: FileSystemFileHandle
	}

	type GitIgnores = {
		ig: ReturnType<typeof ignore>
		path: string
	}

	let content = $state<File>()
	let statuses = $state<Array<string>>([])

	const pick = async () => {
		let gitignores: Array<GitIgnores> = []
		const read = async (
			dir: FileSystemDirectoryHandle,
			path: string = '',
		) => {
			try {
				const gitignore = await (
					dir.getFileHandle('.gitignore')
				)
				if(gitignore) {
					const ig = ignore()
					const file = await gitignore.getFile()
					ig.add((await file.text()).split('\n'))
					gitignores.push({ ig, path })
				}
			} catch(e) {}

			const current = `${path}${dir.name}/`
			statuses.push(`Traversing: ${current}`)

			const here: Node = {
				type: 'directory',
				title: dir.name,
				children: [],
			}

			for await (const handle of dir.values()) {
				const next = `${current}${handle.name}`
				if(gitignores.some(gi => gi.ig.ignores(next))) {
					statuses.push(`Ignoring: ${next}`)
					continue
				}
				if(handle.kind === 'directory') {
					const node = (
						await read(handle, current)
					)
					here.children?.push(node)
				} else {
					statuses.push(`Leaf: ${next}`)

					const node: Node = {
						type: 'file',
						title: handle.name,
						handle,
					}
					here.children?.push(node)
				}
			}

			gitignores = gitignores.filter((gi) => (gi.path.length > path.length))

			return here
		}
		try {
			const root = await read(await window.showDirectoryPicker())
			const tree = new Wunderbaum({
				element: document.getElementById('fs-tree') as HTMLDivElement,
				source: [root],
				activate: async (evt) => {
					if(!evt.node.data.handle) {
						content = undefined
					} else {
						content = await evt.node.data.handle.getFile()
					}
				},
			})
			console.debug({ root, tree })
		} finally {
			statuses = []
		}
	}
</script>

<svelte:head>
	<title>Mïmis</title>
	<meta name="description" content="Collaborative filesystem" />
</svelte:head>

<h1>Mïmis: Collaborative Filesystem</h1>

<main class="flex align-center">
	{#if statuses.length > 0}
		<ol>
			{#each statuses.slice(-35) as status}
				<li>{status}</li>
			{/each}
		</ol>
	{:else}
		<button onclick={pick} class="btn btn-primary bg-green">
			Pick a Directory to Spider
		</button>
	{/if}

	<section id="display">
		<div id="fs-tree"></div>
		{#if content}
			<Content {content}/>
		{/if}
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		#display {
			display: flex;
			align-items: center;
		}

		#fs-tree {
			min-width: var(--min-browser-width);
		}

		#display, #fs-tree {
			flex-grow: 1;
			width: 95%;
		}
	}

	h1 {
		width: 100%;
	}

	ol {
		list-style-type: none;
		counter-reset: reversed(line);

		li::marker {
			counter-increment: line;
  		content: "L:" counter(line) ": ";
		}
	}
</style>
