<script lang="ts">
	import { Wunderbaum } from 'wunderbaum'
	import Content from '../Content.svelte'
	import BeginDialog from '../BeginDialog.svelte'
  import { spiderTree } from '$lib/spiderTree'
	import { wunder2CAR } from '$lib/wunder2CAR'
	import { wunderFiles } from '$lib/wunderFiles'
	import { selectAll } from '$lib/selectAll'
	import 'bootstrap-icons/font/bootstrap-icons.min.css'
	import 'wunderbaum/dist/wunderbaum.css'

	let name = $state<string>()
	let content = $state<File>()
	let car = $state<string>()
	let tree = $state<Wunderbaum>()
	let filename = $derived(
		`${tree?.root.children?.[0].title ?? 'spider'}.${new Date().toISOString()}.car`
	)
	let statuses = $state<Array<string>>([])
	let showBegin = $state<boolean>(false)

	const load = (dirs: Array<FileSystemDirectoryHandle>) => {
		if(dirs.length > 0) {
			spiderTree({
				dirs,
				onStatusUpdate: (s) => { statuses.push(s) },
			})
			.then(selectAll)
			.then((roots) => {
				tree = wunderFiles({
					source: roots,
					mount: 'fs-tree',
					activate: async (evt) => {
						if(!evt.node.data.handle) {
							name = content = undefined
						} else {
							name = evt.node.title
							content = await evt.node.data.handle.getFile()
						}
					},
				})
				console.debug({ tree })
			})
			.finally(() => { statuses = [] })
		}
	}

	const ingest = async () => {
		if(!tree) throw new Error('No tree defined.')

		try {
			car = await wunder2CAR({
				root: tree.root,
				onStatusUpdate: (s) => { statuses.push(s) },
			})
		} finally {
			statuses = []
		}
	}
</script>

<svelte:head>
	<title>Mïmis: Spider</title>
	<meta
		name="description"
		content="Collaborative Filesystem"
	/>
	<link rel="icon" href="car.svg"/>
</svelte:head>

<header>
	<h1>Generate a CAR from the Local File System</h1>
</header>

<main class="flex align-center">
	{#if statuses.length > 0}
		<ol>
			{#each statuses.slice(-35) as status}
				<li>{status}</li>
			{/each}
		</ol>
	{:else}
		<nav>
			<button onclick={() => { showBegin = true }} class="btn btn-primary bg-green">
				Begin A Spider
			</button>
			{#if tree}
				<button onclick={ingest} class="btn btn-primary bg-green">
					Generate CAR Archive
				</button>
			{/if}
			{#if car}
				<a href={car} class="button" download={filename}>
					Download <code>{filename}</code>
				</a>
			{/if}
		</nav>
	{/if}

	<BeginDialog bind:open={showBegin} onsubmit={load}/>

	<section id="display">
		<div id="fs-tree" class:accompanied={!!content}></div>
		<div id="content">
			{#if content}
				{#if name}
					<h2>{name}</h2>
				{/if}
				<Content {content}/>
			{/if}
		</div>
	</section>
</main>

<style>
	header {
		margin-top: 7.5vh;
	}
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-block: 3rem;

		#display {
			display: flex;
			align-items: flex-start;
			justify-content: center;
			width: 100%;
		}

		#fs-tree {
			min-width: var(--min-browser-width);
			max-height: 90vh;
			max-width: 150ch;
		}

		#fs-tree {
			resize: horizontal;
		}

		#content {
			flex-grow: 1;
			max-width: 120ch;

			h2 {
				font-size: clamp(2rem, 2.5vw + 1em, 3rem);
				font-weight: bold;
				text-align: center;
			}
		}
	}

	h1 {
		width: 100%;
	}

	a {
		display: inline-block;
		margin-inline: auto;
	}

	ol {
		list-style-type: none;
		counter-reset: reversed(line);

		li::marker {
			counter-increment: line;
  		content: "L:" counter(line) ": ";
		}
	}

	nav {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 3rem;
	}
</style>
