<script lang="ts">
	import Cell from './Cell.svelte'

  let cols = $state(8)
  let rows = $state(8)

  const { documentElement: html } = document
  const resize = () => {
    if(!(html instanceof HTMLHtmlElement)) {
      throw new Error('`html` is not a `<html>` element.')
    }
    const style = getComputedStyle(html)
    rows = Number(style.getPropertyValue('--rows'))
    cols = Number(style.getPropertyValue('--cols'))
    console.debug({ resize: { cols, rows } })
  }
  const resizes = new ResizeObserver(resize)
  resizes.observe(html)
  $effect(resize)
</script>

<svelte:head>
  <title>Macrodata Refinement</title>
</svelte:head>

<ol id="grid">
  {#each { length: rows }, row}
    <li>
      <ol>
        {#each { length: cols }, col}
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

  :global(html) {
    --gap: 0.25rem;
    --colWidth: 10rem;
    --rows: 10;
    --cols: 8;
  }
  @media(width >= calc(12 * 10rem)) { :global(html) { --cols: 12 } }
  @media(width < calc(12 * 10rem)) { :global(html) { --cols: 11 } }
  @media(width < calc(11 * 10rem)) { :global(html) { --cols: 10 } }
  @media(width < calc(10 * 10rem)) { :global(html) { --cols: 9 } }
  @media(width < calc(9 * 10rem)) { :global(html) { --cols: 8 } }
  @media(width < calc(8 * 10rem)) { :global(html) { --cols: 7 } }
  @media(width < calc(7 * 10rem)) { :global(html) { --cols: 6 } }
  @media(width < calc(6 * 10rem)) { :global(html) { --cols: 5 } }
  @media(width < calc(5 * 10rem)) { :global(html) { --cols: 4 } }
  @media(width < calc(4 * 10rem)) { :global(html) { --cols: 3 } }
  @media(width < calc(3 * 10rem)) { :global(html) { --cols: 2 } }
  @media(width < calc(2 * 10rem)) { :global(html) { --cols: 1 } }

	#grid {
		display: grid;
    --_rows: var(--rows, 8);
    --_cols: var(--cols, 8);
    --_gap: var(--gap, 0.25rem);
    gap: var(--_gap);
		height: calc(
      100dvh - (max(12vh, 4rem) + (var(--_gap) * var(--_rows)))
    );
		grid-template-columns: repeat(var(--_cols), 1fr);
		grid-template-rows: repeat(var(--_rows), calc(100% / var(--_rows)));

		& li, & ol {
			display: contents;
		}
	}
</style>