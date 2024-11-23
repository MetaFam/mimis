<script lang="ts">
	import { Wunderbaum } from 'wunderbaum'
	import Content from './Content.svelte'
	import BeginDialog from './BeginDialog.svelte';
  import { readTree } from '$lib/readTree';
	import 'wunderbaum/dist/wunderbaum.css'
	import 'bootstrap-icons/font/bootstrap-icons.css'
  import { ingestTree } from '$lib/ingestTree';

	let name = $state<string>()
	let content = $state<File>()
	let car = $state<string>()
	let statuses = $state<Array<string>>([])
	let showBegin = $state<boolean>(false)

	const load = (dirs: Array<FileSystemDirectoryHandle>) => {
		if(dirs.length > 0) {
			readTree({
				dirs,
				onStatusUpdate: (s) => { statuses.push(s) },
			})
			.then(([root]) => {
				return ingestTree({
					root,
					onStatusUpdate: (s) => { statuses.push(s) },
				})
			})
			.then(({ root, car: link }) => {
				car = link
				new Wunderbaum({
					element: document.getElementById('fs-tree') as HTMLDivElement,
					source: root,
					activate: async (evt) => {
						if(!evt.node.data.handle) {
							name = content = undefined
						} else {
							name = evt.node.title
							content = await evt.node.data.handle.getFile()
						}
					},
				})
			})
			.finally(() => { statuses = [] })
		}
	}
</script>

<svelte:head>
	<title>Mïmis</title>
	<meta
		name="description"
		content="Collaborative filesystem"
	/>
</svelte:head>

<h1>Mïmis: Collaborative Filesystem</h1>

{#if car}
	<a href={car} download="spider.car">Download</a>
{/if}

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

	<BeginDialog bind:open={showBegin} onsubmit={load}/>

	<section id="display">
		<div id="fs-tree" class:accompanied={!content}></div>
		{#if content}
			<div id="content">
				{#if name}
					<h2>{name}</h2>
				{/if}
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
			align-items: flex-start;
			justify-content: center;
		}

		#fs-tree {
			min-width: var(--min-browser-width);
			max-height: 90vh;
			max-width: 50ch;
		}

		#display, .accompanied {
			width: 100%;
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
</style>
