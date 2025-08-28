<script lang="ts">
  import {
    Position, Rectangle,
    intersection, screen2SVGWithin,
  } from './lib'

  let {
    row = $bindable(),
    col = $bindable(),
  } = $props()

  let text = $state<SVGTextElement | null>(null)
  let svg = $state<SVGSVGElement | null>(null)

  let bounds = $derived.by(() => {
    if(!text) return new Rectangle()
    const bbox = text.getBoundingClientRect()
    return new Rectangle({
      x: bbox.x,
      y: bbox.y,
      w: bbox.width,
      h: bbox.height,
    })
  })
  let mouse = $state(new Position())

  document.addEventListener('mousemove', (evt) => {
    try {
      mouse = new Position({ x: evt.clientX, y: evt.clientY })
    } catch(error) {
      console.error({ 'Mouse Update': error })
    }
  })

  const viewBox = {
    x: -12,
    y: 0,
    h: 55,
    get w() {
      return 2 * Math.abs(this.x)
    }
  }

  let fwd = $derived(screen2SVGWithin(
    svg!,
    intersection({
      points: { start: bounds.center, inline: mouse },
      bounds,
      forward: true,
    })
  ))
  const back = $derived(screen2SVGWithin(
    svg!,
    intersection({
      points: { start: bounds.center, inline: mouse },
      bounds,
      forward: false,
    })
  ))
  const line = $derived(
    (fwd && back ? ({
      x1: fwd.x, y1: fwd.y,
      x2: back.x, y2: back.y,
    }) : ( null ))
  )
</script>

<svg
  bind:this={svg}
  width="100%" height="100%"
  viewBox="{viewBox.x} {viewBox.y} {viewBox.w} {viewBox.h}"
  preserveAspectRatio="none"
>
  {#if line}
    <line {...line}/>
  {/if}
  <rect
    x={viewBox.x}
    y={viewBox.y}
    width={viewBox.w}
    height={viewBox.h}
  />
  <text
    bind:this={text}
    textLength="100%"
    lengthAdjust="spacingAndGlyphs"
  >
    <tspan dy="0.75lh">ℳ: «{col}, {row}»</tspan>
    <tspan x="0" dy="0.75lh">
      🐭: «{mouse.x.toFixed(1)}, {mouse.y.toFixed(1)}»
    </tspan>
    <!-- <tspan x="0" dy="0.75lh">⊛: «{bounds?.center?.x}, {bounds?.center?.y}»</tspan> -->
    <tspan x="0" dy="0.75lh">
      ☐: «{Math.round(bounds?.x ?? 0)}, {Math.round(bounds?.y ?? 0)}»
      → «
        {Math.round((bounds?.x ?? 0) + (bounds?.w ?? 0))},
        {Math.round((bounds?.y ?? 0) + (bounds?.h ?? 0))}
      »
    </tspan>
  </text>
  <!--
  <rect
    x={mouse.x}
    y={mouse.y}
    width={
      [Math.max(mouse.x, bounds.center.x), Math.min(mouse.x, bounds.center.x)]
      .reduce((acc, val) => (acc - val))
    }
    height={
      [Math.max(mouse.y, bounds.center.y), Math.min(mouse.y, bounds.center.y)]
      .reduce((acc, val) => (acc - val))
    }
  />
  -->
</svg>

<style>
  rect:first-of-type {
    fill: orange;
    fill-opacity: 50%;
    stroke: orangered;
  }
  rect:last-of-type {
    fill: blue;
    fill-opacity: 25%;
    stroke: green;
    stroke-width: 0.25;
  }
  text {
    text-anchor: middle;
    fill: white;
  }
  line {
    stroke: yellow;
    stroke-width: 1;
  }

  div {
    text-align: center;
  }
</style>