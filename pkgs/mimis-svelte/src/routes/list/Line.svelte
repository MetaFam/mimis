<script lang="ts">
  import type { Entry } from './+page.svelte'
  import { page } from '$app/state'
  import DeleteConfirm from './DeleteConfirm.svelte'
  import Display from './Display.svelte'
  import Zoomed from './Zoomed.svelte'
  import context from './context.svelte'

  const debug = !!page.url.searchParams.get('debug')

  class NotMediaError extends Error {
    constructor() { super('Not a media element.') }
  }

  let {
    datum = $bindable(null), index,
  }: {
    datum: Entry | null, index: number
  } = $props()
  let summary = $state<HTMLElement | null>(null)
  let content = $state<HTMLElement | null>(null)
  if(datum == null) throw new Error(' `null` `datum`.')
  const { id: itemId, cid, title, type } = datum
  let open = $state(false)
  let details = $state<HTMLDetailsElement | null>(null)
  let deleteConfirm = $state<HTMLDialogElement | null>(null)
  let zoomed = $state<HTMLDialogElement | null>(null)
  const { single, showAll } = context

  $effect(() => {
    const listener = (event: Event) => {
      zoomed?.showModal()
    }
    content?.addEventListener('dblclick', listener)
    return () => content?.removeEventListener('dblclick', listener)
  })

  $effect(() => {
    if(index === 0) summary?.focus()
  })

  function togglePlay(
    media: HTMLElement | null,
    options?: {
      play?: boolean | null
      pitch?: boolean | null
    }
  ) {
    const { play = null, pitch = null } = options ?? {}
    if(!(media instanceof HTMLMediaElement)) {
      if(pitch === false) return
      if(debug) console.debug({ rejecting: media })
      throw new NotMediaError()
    }
    if((media.paused || play === true) && play !== false) {
      if(debug) console.debug({ playing: media })
      media.play()
    } else {
      if(debug) console.debug({ pausing: media })
      media.pause()
    }
  }
  // @ts-expect-error
  context.register(togglePlay, { itemId })

  function toggleOpen(
    details: HTMLDetailsElement,
    options?: { open?: boolean | null }
  ) {
    if(
      (details?.open || options?.open === true)
      && options?.open !== false
    ) {
      if(debug) console.debug({ opening: details })
      details.open = true
      open = true
    } else {
      if(debug) console.debug({ closing: details })
      if(!details) return
      details.removeAttribute('open')
      open = false
      togglePlay(content, { play: false, pitch: false })
    }
  }
  // @ts-expect-error
  context.register(toggleOpen, { itemId })

  const togglePlayOrOpen = () => {
    try {
      togglePlay(content)
    } catch(error) {
      if(details) toggleOpen(details)
    }
  }

  function zoom() {
    if(debug) console.debug({ zoom: {
      datum, open: zoomed?.open, modal: zoomed?.matches(':modal'),
    } })
    if(zoomed?.matches(':modal')) {
      zoomed?.close()
    } else {
      zoomed?.showModal()
    }
  }
  context.register(zoom, { itemId })

  function remove() {
    deleteConfirm?.showModal()
  }
  context.register(remove, { itemId })

  const openProp: { open?: boolean } = {}
  if(debug) console.debug({ open })
  if(open || showAll) {
    openProp.open = true
  }
</script>

<svelte:document
  onclick={({ target }) => {
    if(debug) console.debug({ doc: { clicked: target } })
    const item = (target as HTMLElement).closest('li')
    if(item && item != content?.closest('li')) {
      togglePlay(content, { play: false, pitch: false })
    }
  }}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<details
  {...openProp}
  bind:this={details}
  name="file{single ? '' : index + 1}"
  id="deets-{index + 1}"
  onclick={(evt) => {
    const { currentTarget: details, target } = evt
    if(debug) console.debug({ 'details:onclick': {
      '🔑': evt.key,
      clicked: target,
      details,
      media: content instanceof HTMLMediaElement,
      targeted: target === content,
      evt,
    } })
    if(
      target === content
      && content instanceof HTMLMediaElement
      && details.open
    ) {
      evt.preventDefault()
      togglePlay(content)
    } else if(details.open) {
      evt.preventDefault()
      toggleOpen(details, { open: false })
    }
  }}
  onkeypress={(evt) => {
    const details = evt.currentTarget
    if(debug) console.debug({ 'details:onkeypress': {
      '🔑': evt.key,
      open: details.open,
    } })
    if(evt.key === 'Escape') {
      toggleOpen(details, { open: false })
    } else if(details.open) {
      if(evt.key === 'Enter') {
        evt.preventDefault()
        toggleOpen(details, { open: false })
      } else if(evt.key === ' ') {
        togglePlayOrOpen()
      }
    }
  }}
  onkeydown={(evt) => {
    if(/^Arrow(Up|Down)$/.test(evt.key)) {
      const item = evt.currentTarget.closest('li')
      const sib = (
        evt.key.endsWith('Up') ? (
          item?.previousElementSibling
        ) : (
         item?.nextElementSibling
        ) as HTMLLIElement
      )
      if(!sib) return
      sib.querySelector('summary')?.focus()
      evt.preventDefault()
    }
  }}
>
  <summary
    tabindex={0}
    bind:this={summary}
    onkeypress={(evt) => {
      const details = (
        evt.currentTarget.closest('details')
      )
      if(!details) return
      if(debug) console.debug({ 'summary:onclick': {
        '🔑': evt.key,
        open: details?.open,
        content,
        evt,
      } })
      if(details.open && evt.key === ' ') {
        evt.preventDefault()
        evt.stopImmediatePropagation()
        // togglePlayOrOpen()
      }
    }}
  >{title}</summary>
  <Display {datum} bind:content/>
</details>

<DeleteConfirm
  {datum}
  bind:handle={deleteConfirm}
/>

<Zoomed
  {datum}
  bind:handle={zoomed}
/>

<style>
  details::before {
    content: "⣿ " counter(entry) " ⣿";
    counter-increment: entry;
    font-weight: bold;
    position: absolute;
    left: 0.5rem;
  }
  details {
    position: relative;
    color: light-dark(
      var(--fg, var(--bg)),
      color-mix(in oklab, var(--bg), #FFFA 75%)
    );
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    padding-inline-start: 4rem;
    border-radius: 0.25rem;
    interpolate-size: allow-keywords;

    &::details-content {
      opacity: 0;
      block-size: 0;
      overflow-y: clip;
      --anim-dur: 0.25s;
      transition:
        content-visibility var(--anim-dur) allow-discrete,
        opacity var(--anim-dur),
        block-size var(--anim-dur)
      ;
    }

    summary {
      margin-inline-start: 1.25rem;
      text-indent: -1.5rem;
    }

    &[open]::details-content {
      opacity: 1;
      block-size: auto;
    }

    & summary {
      position: relative;
      cursor: pointer;
    }

    &:hover {
      background: color-mix(in oklab, var(--bg), #FFFA 75%);
      color: color-mix(in oklab, var(--bg), #0009 90%);
    }
  }
</style>