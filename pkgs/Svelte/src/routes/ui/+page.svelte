<script lang="ts">
	import Cell from './Cell.svelte'

  class Matrix {
    public cols: number
    public rows: number

    constructor({
      cols = 8,
      rows = 8,
    } = {}) {
      this.cols = $state(cols)
      this.rows = $state(rows)
    }
  }

  const { documentElement: html } = document
  const num = new Matrix()

  type LimitedRecord = (
    Pick<MutationRecord, 'type' | 'attributeName' | 'target'>
  )

  const mutate = (mutations: Array<LimitedRecord>) => {
    console.debug({ mutations })
    mutations.forEach((mutation) => {
      const { attributeName: attr, type, target } = mutation
      if(target != document.documentElement) {
        throw new Error(`Node "${target.nodeName}" is not the root.`)
      }
      if(!(target instanceof HTMLHtmlElement)) {
        throw new Error('`target` is not a `<html>` element.')
      }
      if(type === 'attributes' && attr === 'style') {
        num.rows = (
          Number(getComputedStyle(target).getPropertyValue('--rows'))
        )
        num.cols = (
          Number(getComputedStyle(target).getPropertyValue('--cols'))
        )
      }
    })
  }
  const mutations = new MutationObserver(mutate)
  mutations.observe(
    document.documentElement,
    {
      attributes: true,
      attributeFilter: ['--rows', '--cols'],
    }
  )
  $effect(() => mutate([{
    type: 'attributes',
    attributeName: 'style',
    target: document.documentElement,
  }]))
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