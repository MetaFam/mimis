<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { resolve } from '$app/paths'
  import type ForceGraph from 'force-graph'
  import { graphData, type GraphData, type GraphNode, type GraphLink } from '$lib/remotes/graphData.remote'
  import Eyes from '$lib/assets/infinity eyes.svg'

  let container = $state<HTMLDivElement>()
  let graph: ForceGraph<GraphNode, GraphLink> | null = null
  let errorMsg = $state<string | null>(null)
  let data = $state<GraphData | null>(null)

  // A stable color per vertex/edge label so the structure is legible at a glance.
  const palette = [
    '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
    '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990',
  ]
  const colors = new Map<string, string>()
  function colorFor(label: string) {
    let color = colors.get(label)
    if(!color) {
      color = palette[colors.size % palette.length]
      colors.set(label, color)
    }
    return color
  }

  // `valueMap()` wraps each property value in an array, so unwrap singletons.
  function prop(properties: Record<string, unknown>, key: string) {
    const value = properties[key]
    return Array.isArray(value) ? value[0] : value
  }

  function escapeHTML(value: unknown) {
    return String(value).replace(/[&<>"']/g, (ch) => (
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!)
    ))
  }

  function labelFor(node: GraphNode) {
    const { properties: p } = node
    // File nodes get a full property listing; everything else a one-line summary.
    if(node.label === 'File') {
      const rows = (
        Object.entries(p)
        .map(([key, value]) => (
          `<tr><th>${escapeHTML(key)}</th>`
          + `<td>${escapeHTML(prop(p, key))}</td></tr>`
        ))
        .join('')
      )
      return (
        `<strong>${node.label}</strong>`
        + (rows ? `<table>${rows}</table>` : '')
      )
    }
    const named = (
      p.path ?? p.name ?? p.signer ?? p.cid ?? p.createdAt
    )
    return named != null ? `${node.label}: ${named}` : node.label
  }

  function labelForLink(link: GraphLink) {
    const path = prop(link.properties, 'path')
    return path != null ? `${link.label}: ${path}` : link.label
  }

  onMount(async () => {
    try {
      data = await graphData({ limit: 1000 })
    } catch(err) {
      console.error({ graphPage: err })
      errorMsg = (err as Error).message
      return
    }

    const { default: ForceGraph } = await import('force-graph')
    if(!container) throw new Error('Graph container not mounted.')

    // Boxes occupied by already-drawn edge labels in the current frame, used to
    // nudge later labels into free space instead of stacking them at midpoints.
    type Box = { x0: number, y0: number, x1: number, y1: number }
    const occupied: Array<Box> = []
    const overlaps = (a: Box, b: Box) => (
      a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
    )

    graph = new ForceGraph<GraphNode, GraphLink>(container)
      .graphData(data)
      .nodeId('id')
      .nodeLabel((node) => labelFor(node))
      .nodeColor((node) => colorFor(node.label))
      .nodeRelSize(5)
      .linkColor(() => 'rgba(150, 150, 150, 0.4)')
      .linkLabel((link) => labelForLink(link))
      .linkDirectionalArrowLength(4)
      .linkDirectionalArrowRelPos(1)
      .linkWidth(1)
      .onRenderFramePre(() => { occupied.length = 0 })
      .linkCanvasObjectMode(() => 'after')
      .linkCanvasObject((link, ctx, globalScale) => {
        const path = prop(link.properties, 'path')
        if(path == null) return
        // force-graph replaces source/target with node objects once laid out.
        const source = link.source as unknown as GraphNode
        const target = link.target as unknown as GraphNode
        if(source?.x == null || target?.x == null) return

        const sx = source.x, sy = source.y ?? 0
        const tx = target.x, ty = target.y ?? 0
        const midX = (sx + tx) / 2
        const midY = (sy + ty) / 2
        // Divide by √globalScale (not globalScale) so the on-screen label size
        // grows with zoom — fontSize × globalScale = 12 × √globalScale — rather
        // than staying a constant pixel size.
        const fontSize = Math.max(2, 12 / Math.sqrt(globalScale))
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const text = String(path)
        const { width } = ctx.measureText(text)
        const pad = fontSize * 0.2
        const halfW = width / 2 + pad
        const halfH = fontSize / 2 + pad

        // Unit vector perpendicular to the edge: the direction to slide the
        // label so it clears neighbours while staying near its own edge.
        const len = Math.hypot(tx - sx, ty - sy) || 1
        const px = -(ty - sy) / len
        const py = (tx - sx) / len
        const step = fontSize + pad * 2

        let cx = midX, cy = midY
        for(let i = 0; i < 16; i++) {
          // Probe offsets 0, +1, −1, +2, −2, … steps along the perpendicular.
          const k = Math.ceil(i / 2) * (i % 2 === 1 ? 1 : -1)
          cx = midX + px * step * k
          cy = midY + py * step * k
          const box = {
            x0: cx - halfW, y0: cy - halfH,
            x1: cx + halfW, y1: cy + halfH,
          }
          if(i === 15 || !occupied.some((b) => overlaps(b, box))) {
            occupied.push(box)
            break
          }
        }

        // When displaced from the edge, draw a faint leader back to it.
        if(cx !== midX || cy !== midY) {
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)'
          ctx.lineWidth = Math.max(0.5, 0.5 / globalScale)
          ctx.beginPath()
          ctx.moveTo(midX, midY)
          ctx.lineTo(cx, cy)
          ctx.stroke()
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.fillRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2)
        ctx.fillStyle = '#222'
        ctx.fillText(text, cx, cy)
      })
      .onNodeClick((node) => {
        graph?.centerAt(node.x, node.y, 600).zoom(4, 600)
      })

    const resize = () => {
      if(container && graph) {
        graph.width(container.clientWidth).height(container.clientHeight)
      }
    }
    resize()
    window.addEventListener('resize', resize)
    onDestroy(() => window.removeEventListener('resize', resize))
  })

  onDestroy(() => {
    graph?._destructor?.()
  })

  const labels = $derived(
    data ? [...new Set(data.nodes.map((n) => n.label))] : []
  )
</script>

<svelte:head>
  <title>ï: Graph</title>
  <link rel="icon" href={Eyes}/>
</svelte:head>

<main>
  <header>
    <a class="home" href={resolve('/')} title="Back to files">🢗 Files</a>
    <h1>Force Graph</h1>
    {#if data}
      <span class="stats">
        {data.nodes.length} nodes · {data.links.length} edges
      </span>
    {/if}
    <ul class="legend">
      {#each labels as label (label)}
        <li>
          <span class="swatch" style:background-color={colorFor(label)}></span>
          {label}
        </li>
      {/each}
    </ul>
  </header>

  {#if errorMsg}
    <p class="error">¡Could not load the graph! {errorMsg}</p>
  {:else if !data}
    <p class="loading">Loading graph from JanusGraph…</p>
  {:else if data.nodes.length === 0}
    <p class="loading">The graph is empty.</p>
  {/if}

  <div id="graph" bind:this={container}></div>
</main>

<style>
  /* force-graph renders node tooltips as HTML in a body-level .graph-tooltip. */
  :global(.graph-tooltip table) {
    border-collapse: collapse;
    margin-top: 0.35em;
    font-size: 0.85em;
  }
  :global(.graph-tooltip th),
  :global(.graph-tooltip td) {
    padding: 0.1em 0.5em;
    text-align: left;
    vertical-align: top;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  :global(.graph-tooltip th) {
    opacity: 0.7;
    font-weight: 600;
    white-space: nowrap;
  }
  :global(.graph-tooltip td) {
    word-break: break-all;
    max-width: 28em;
  }

  :global(body) {
    margin: 0;
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    border-bottom: 2px solid #3333;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.2rem;
    margin: 0;
  }

  .home {
    text-decoration: none;
    padding: 0.25rem 0.75rem;
    border: 1px solid #3333;
    border-radius: 0.5rem;
  }
  .home:hover {
    background-color: #9993;
  }

  .stats {
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
    margin-inline-start: auto;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
  }
  .swatch {
    display: inline-block;
    width: 0.85em;
    height: 0.85em;
    border-radius: 50%;
  }

  .error, .loading {
    padding: 1rem;
    margin: 0;
  }
  .error {
    color: #e6194b;
  }

  #graph {
    flex-grow: 1;
    min-height: 0;
  }
</style>
