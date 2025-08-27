<script lang="ts">
	import Cell from './Cell.svelte'

	const num = { rows: 10, cols: 10 }
	$effect(() => (
		document.documentElement.style.setProperty(
      '--rows', String(num.rows),
    ))
	)
  $effect(() => (
		document.documentElement.style.setProperty(
      '--cols', String(num.cols),
    )
  ))
</script>

<ol id="grid">
	{#each { length: num.cols }, col}
		<li>
			<ol>
				{#each { length: num.rows }, row}
					<li>
						<Cell row={row + 1} col={col + 1}/>
					</li>
				{/each}
			</ol>
		</li>
	{/each}
</ol>

<style>
	:global(html, body) {
		margin: 0;
	}

	#grid {
		display: grid;
		height: calc(100dvh - max(12vh, 4rem));
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), calc(100% / var(--rows)));

		& li, & ol {
			display: contents;
		}
	}
</style>