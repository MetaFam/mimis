<script lang="ts">
	import {
		Position, Rectangle, WinDims,
    screen2SVGWithin, type CTMable,
	} from './lib'

	let {
		row = $bindable(),
		col = $bindable(),
	} = $props()

	let text = $state<SVGTextElement | null>(null)
	let svg = $state<SVGSVGElement | null>(null)

	let bounds = $derived.by(() => {
		if(!text) return null
		const bbox = text.getBoundingClientRect()
		return new Rectangle({
			x: bbox.x,
			y: bbox.y,
			w: bbox.width,
			h: bbox.height,
		})
	})
	let mouse = $state(new Position())
  let cell = $state(new Position())
	let win = $state(new WinDims())

	document.addEventListener('resize', (evt) => {
		win = new WinDims()
	})

	document.addEventListener('mousemove', (evt) => {
		try {
      if(!evt.target) {
        throw new Error('`evt.target` is not defined.')
      }
      if(evt.target instanceof SVGElement) {
        cell = new Position(
          screen2SVGWithin(
            evt.target as CTMable,
            new Position({ x: evt.clientX, y: evt.clientY }),
          )
        )
      }
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
</script>

<svg
	bind:this={svg}
	width="100%" height="100%"
	viewBox="{viewBox.x} {viewBox.y} {viewBox.w} {viewBox.h}"
	preserveAspectRatio="none"
>
	<text
		bind:this={text}
		textLength="100%"
		lengthAdjust="spacingAndGlyphs"
	>
		<tspan dy="0.75lh">ℳ: «{row}, {col}»</tspan>
		<tspan x="0" dy="0.75lh">
      🐭: «{mouse.x.toFixed(1)}, {mouse.y.toFixed(1)}»
    </tspan>
		<!-- <tspan x="0" dy="0.75lh">⊛: «{bounds?.center?.x}, {bounds?.center?.y}»</tspan> -->
		<tspan x="0" dy="0.75lh">
      ☐: «{bounds?.x?.toFixed(1)}, {bounds?.y?.toFixed(1)}»
	  → «
      {((bounds?.x ?? 0) + (bounds?.w ?? 0)).toFixed(1)},
      {((bounds?.y ?? 0) + (bounds?.h ?? 0)).toFixed(1)}
    »
    </tspan>
	</text>
	<rect
		x={viewBox.x}
		y={viewBox.y}
		width={viewBox.w}
		height={viewBox.h}
	/>
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
	rect:first-child {
		fill: orange;
		fill-opacity: 50%;
		stroke: orangered;
	}
	rect:last-child {
		fill: blue;
		fill-opacity: 25%;
		stroke: green;
		stroke-width: 0.25;
	}
	text {
		text-anchor: middle;
		fill: white;
	}

	div {
		text-align: center;
	}
</style>