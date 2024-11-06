<script lang="ts">
	import TreeView from 'react-accessible-treeview'

	type Node = {
		name: string
		children?: Array<number>
		id: number
		parent: number | null
	}

	let nodes = $state<Array<Node>>([])
	let statuses = $state<Array<string>>([])

	const pick = async () => {
		const read = async ({
			dir, parent,
		}: {
			dir: FileSystemDirectoryHandle
			parent?: Node | null
		}) => {
			statuses.push(`Traversing: ${dir.name}`)

			const here: Node = {
				name: dir.name,
				children: [],
				id: nodes.length,
				parent: parent?.id ?? null,
			}
			nodes.push(here)

			for await (const handle of dir.values()) {
				if(handle.kind === 'directory') {
					const node = (
						await read({
							dir: handle, parent: here,
						})
					)
					here.children?.push(node.id)
				} else {
					statuses.push(`Leaf: ${handle.name}`)

					const file = {
						name: handle.name,
						id: nodes.length,
						parent: here.id,
					}
					nodes.push(file)
					here.children?.push(file.id)
				}
			}
			return here
		}
		await read({
			dir: await window.showDirectoryPicker()
		})
		console.debug({ nodes })
		statuses = []
	}
</script>

<svelte:head>
	<title>Mïmis</title>
	<meta name="description" content="Collaborative filesystem" />
</svelte:head>

<h1>Mïmis: Collaborative Filesystem</h1>

<section class="flex align-center">
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

	{#if nodes.length > 0}
		<TreeView
			data={nodes}
			aria-label="Mïmis Filesystem"
			nodeRenderer={
				(
					{ element, getNodeProps, level }: {
						element: Node
						getNodeProps: () => Record<string, string>
						level: number
					}
				) => (
					<div
						{...getNodeProps()}
						style={{ paddingLeft: 20 * (level - 1) }}
					>
						{element.name}
					</div>
				)
			}
		/>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
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
