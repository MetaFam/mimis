<script lang="ts">
  import Hammer from 'hammerjs'
  import Display from './Display.svelte'
  import context from './context.svelte'

  let {
    datum, handle = $bindable<HTMLDialogElement | null>(null)
  } = $props()
  let content = $state<HTMLElement | null>(null)
  const { debug } = context

  $effect(() => {
    const mc = new Hammer(handle)
    mc.on('panright', () => {
      if(content && content instanceof HTMLMediaElement) {
        content.currentTime += 2
      }
    })
    mc.on('panleft', () => {
      if(content && content instanceof HTMLMediaElement) {
        content.currentTime -= 2
      }
    })
    mc.on('doubletap', () => {
      handle.close()
    })
  })
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  class="zoom"
  bind:this={handle}
  onclick={() => {}}
  onkeydown={(evt) => {
    if(['z', 'Escape'].includes(evt.key)) {
      handle.close()
      evt.stopPropagation()
    } else if(['Enter', 'ArrowRight', 'ArrowDown'].includes(evt.key)) {
      evt.stopImmediatePropagation()
      let next = (
        handle.closest('li')
        ?.nextElementSibling
        ?.querySelector('.zoom')
      )
      if(!next) {
        next = (
          handle.closest('li')
          ?.parentElement
          ?.firstElementChild
          ?.querySelector('.zoom')
        )
      }
      if(next) {
        handle.close()
        next.showModal()
      }
    } else if(['ArrowLeft', 'ArrowUp'].includes(evt.key)) {
      evt.stopImmediatePropagation()
      let prev = (
        handle.closest('li')
        ?.previousElementSibling
        ?.querySelector('.zoom')
      )
      if(!prev) {
        prev = (
          handle.closest('li')
          ?.parentElement
          ?.lastElementChild
          ?.querySelector('.zoom')
        )
      }
      if(prev) {
        handle.close()
        prev.showModal()
      }
    } else if([' '].includes(evt.key) && content instanceof HTMLMediaElement) {
      evt.preventDefault()
      if(content.paused) {
        content.play()
      } else {
        content.pause()
      }
    } else if(['m'].includes(evt.key) && content instanceof HTMLMediaElement) {
      evt.preventDefault()
      if(content.muted) {
        content.muted = false
      } else {
        content.muted = true
      }
    } else if(['+'].includes(evt.key)) {
      evt.stopImmediatePropagation()
      const style = {
        dialog: getComputedStyle(handle),
        content: getComputedStyle(content),
      }
      const axes = ['width', 'height'] as const
      const [width, height] = (
        axes.map(
          (axis) => style.dialog.getPropertyValue(`--max-${axis}`)
        )
      )
      const parse = (value: string) => {
        const [_, scale, unit] = value.match(/([0-9.]+)(\D+)/) ?? []
        return { scale: Number(scale), unit }
      }
      const size = { width: parse(width), height: parse(height) } as const
      const ratio = style.content.getPropertyValue('aspect-ratio')
      if(content && !/\d|\./g.test(ratio)) {
        const bbox = content.getBoundingClientRect()
        const ar = String(bbox.width / bbox.height)
        if(debug) console.debug({ resizing: bbox, ratio, new: ar })
        content.style.setProperty('aspect-ratio', ar)
      }
      const bigger = Object.fromEntries(axes.map((axis) => (
        [axis, `${size[axis].scale * 1.2}${size[axis].unit}`]
      )))
      if(debug) console.debug({ size, bigger })
      axes.forEach((axis) => {
        handle.style.setProperty(`--max-${axis}`, bigger[axis])
      })
    } else {
      console.debug({ 'dialog:onkeypress': { '🔑': evt.key } })
    }
  }}
>
  <h1>{datum.title}</h1>
  <Display {datum} bind:content/>
</dialog>

<style>
  dialog {
    padding: 0;
  }
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.75);
  }
  h1 {
    margin-block: 1rem;
  }
  dialog {
    --max-width: 95vw;
    --max-height: 92vh;
    width: fit-content;
    height: fit-content;
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    place-self: center;
  }

  @media(width <= 1024px) {
    h1 {
      display: none;
    }

    dialog {
      border: none;
      margin: 0;
      --max-width: 100vw;
      --max-height: 100vh;
    }
  }
</style>