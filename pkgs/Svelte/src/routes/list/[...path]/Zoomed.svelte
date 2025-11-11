<script lang="ts">
  import Display from './Display.svelte'
  import context from './context.svelte'
  import { toggle } from '$lib';

  let {
    datum, handle = $bindable<HTMLDialogElement | null>(null)
  } = $props()
  let content = $state<HTMLElement | null>(null)
  const { debug } = context

  let Hammer
  $effect(() => {
    Hammer  = import('hammerjs')
  })

  type Adjustment = { factor?: number, scale?: number, to?: null | number }

  function zoom({ factor = 1, scale = 0 }: Adjustment) {
    if(!content) throw new Error('`content` is null.')
    const style = getComputedStyle(content)
    let current = Number(style.scale)
    if(isNaN(current)) current = 1
    let next = (current * factor) + scale
    if(debug) console.debug({ zoom: current, factor, scale, next })
    content.style.scale = String(next)
    handle.style.setProperty('--max-width', 'auto')
    handle.style.setProperty('--max-height', 'auto')
  }

  function crank({ factor = 1, scale = 0 }: Adjustment) {
    if(!content) throw new Error('`content` is null.')
    if(!(content instanceof HTMLMediaElement)) {
      if(debug) console.warn('`content` is not a media element.')
    } else {
      const current = content.volume
      let next = (current * factor) + scale
      if(debug) console.debug({ volume: current, factor, scale, next })
    }
  }

  function seek({ factor = 1, scale = 0, to = null }: Adjustment) {
    if(!content) throw new Error('`content` is null.')
    if(!(content instanceof HTMLMediaElement)) {
      if(debug) console.warn('`content` is not a media element.')
    } else {
      let current = content.currentTime
      if(to != null) {
        if(to < 1) {
          current = to * content.duration
        } else {
          current = to
        }
      }
      let next = (current * factor) + scale
      if(debug) console.debug({ time: current, to, factor, scale, next })
      content.currentTime = next
    }
  }

  const toggles = $derived.by(() => {
    const controls = ['play|pause', '(un)?mute', 'fullscreen'] as const
    const out = Object.fromEntries(controls.map((key) => [key, () => {}]))
    if(!content) {
      if(debug) console.warn('`content` is null.')
    } else if(!(content instanceof HTMLMediaElement)) {
      if(debug) console.warn('`content` is not a media element.')
    } else {
      const media = content as HTMLMediaElement
      Object.assign(out, {
        'play|pause': toggle({
          condition: () => media.paused,
          branch: {
            if: () => media.play(),
            else: () => media.pause(),
          },
        }),
        '(un)?mute': toggle({
          branch: { if: () => media.muted = !media.muted },
        }),
        'fullscreen': toggle({
          condition: () => !!document.fullscreenElement,
          branch: {
            if: () => document.exitFullscreen(),
            else: () => media.requestFullscreen(),
          },
        })
      } as const)
    }
    return out
  })

  function shift(Δ: number) {
    let next = handle
    const up = Δ >= 0
    if(Math.abs(Δ) > 0) {
      do {
        next = (
          next.closest('li')
          ?.[up ? 'previousElementSibling' : 'nextElementSibling']
          ?.querySelector('.zoom')
        )

        if(!next) {
          next = (
            handle.closest('li')
            ?.parentElement
            ?.[up ? 'lastElementChild' : 'firstElementChild']
            ?.querySelector('.zoom')
          )
        }

        Δ += up ? -1 : 1
      } while(Math.abs(Δ) > 0 && !!next)
    }

    if(next) {
      handle.close()
      next.showModal()
    }
  }

  $effect(() => {
    const mc = new Hammer(handle)
    mc.get('pinch').set({ enable: true })
    mc.on('swiperight', () => { shift(1) })
    mc.on('swipeleft', () => { shift(-1) })
    mc.on('panright', () => { seek({ scale: 2 }) })
    mc.on('panleft', () => { seek({ scale: -2 }) })
    mc.on('panup', () => { crank({ scale: 20 }) })
    mc.on('pandown', () => { crank({ scale: -20 }) })
    mc.on('pinchin', () => { zoom({ factor : 0.8 }) })
    mc.on('pinchout', () => { zoom({ factor: 1.2 }) })
    mc.on('tap', () => { toggles['play/pause']?.() })
    mc.on('doubletap', () => { handle.close() })
  })
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  class="zoom"
  bind:this={handle}
  onclick={() => {}}
  onkeydown={(evt) => {
    if(debug) console.debug({ 'zoom:onkeydown': {
      '🔑': evt.key,
      isMedia: content instanceof HTMLMediaElement,
    } })
    evt.stopImmediatePropagation()
    if(['z', 'Escape'].includes(evt.key)) {
      handle.close()
    } else if(['Enter', 'ArrowDown'].includes(evt.key)) {
      if(content instanceof HTMLMediaElement) {
        content.pause()
      }
      shift(1)
    } else if(['ArrowUp'].includes(evt.key)) {
      if(content instanceof HTMLMediaElement) {
        content.pause()
      }
      shift(-1)
    } else if(['ArrowLeft'].includes(evt.key) && content instanceof HTMLMediaElement) {
      seek({ scale: -30 })
    } else if(['ArrowRight'].includes(evt.key) && content instanceof HTMLMediaElement) {
      seek({ scale: 30 })
    } else if([' '].includes(evt.key) && content instanceof HTMLMediaElement) {
      toggles['play|pause']()
    } else if(['m'].includes(evt.key) && content instanceof HTMLMediaElement) {
      toggles['(un)?mute']()
    } else if(['+', '='].includes(evt.key)) {
      zoom({ factor: 1.2 })
    } else if(['-', '_'].includes(evt.key)) {
      zoom({ factor: 0.8 })
    } else if(['f'].includes(evt.key) && content instanceof HTMLMediaElement) {
      toggles['fullscreen']()
    } else if(/^\d$/.test(evt.key)) {
      seek({ to: Number(evt.key) / 9 - 0.00001 })
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