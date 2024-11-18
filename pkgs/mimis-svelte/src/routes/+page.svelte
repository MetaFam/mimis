<script lang="ts" module>
	import { Wunderbaum } from 'wunderbaum'
	import Content from './Content.svelte'
	import BeginDialog from './BeginDialog.svelte';
  import { readTree } from '$lib/readTree';
	import 'wunderbaum/dist/wunderbaum.css'
	import 'bootstrap-icons/font/bootstrap-icons.css'

	let content = $state<File>()
	let statuses = $state<Array<string>>([])
	let showBegin = $state<boolean>(false)
	let dirs = $state<Array<FileSystemDirectoryHandle>>([])

	$effect(() => {
		readTree(dirs)
		.then((root) => {
			new Wunderbaum({
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
		})
		.finally(() => { statuses = [] })
	})
</script>

<svelte:head>
	<title>Mïmis</title>
	<meta
		name="description"
		content="Collaborative filesystem"
	/>
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
		<button onclick={() => { showBegin = true }} class="btn btn-primary bg-green">
			Begin A Spider
		</button>
	{/if}

	<BeginDialog bind:open={showBegin} bind:dirs/>

	<section id="display">
		<div id="fs-tree" class:accompanied={!content}></div>
		{#if content}
			<div id="content">
				<Content {content}/>
			</div>
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
			max-height: 90vh;
		}

		#display, .accompanied {
			width: 100%;
		}

		#fs-tree {
			resize: horizontal;
		}

		#content {
			flex-grow: 1;
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
