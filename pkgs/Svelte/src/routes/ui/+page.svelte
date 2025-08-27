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
  document.documentElement.style.setProperty(
    '--gap', '0.25rem',
  )
</script>

<svelte:head>
  <title>Macrodata Refinement</title>
</svelte:head>

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
    --_gap: var(--gap, 0.25rem);
    gap: var(--_gap);
		height: calc(
      100dvh - (max(12vh, 4rem) + (var(--_gap) * var(--rows)))
    );
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), calc(100% / var(--rows)));

		& li, & ol {
			display: contents;
		}
	}
</style>