<script lang="ts">
  import { toHTTP } from '$lib/toHTTP'
  import type { Entry } from './+page.svelte'
  import { page } from '$app/state'
  import DeleteConfirm from './DeleteConfirm.svelte';
    import Display from './Display.svelte';

  const debug = !!page.url.searchParams.get('debug')

  class NotMediaError extends Error {
    constructor() { super('Not a media element.') }
  }

  let { datum = $bindable(null) }: { datum: Entry | null } = $props()
  let content = $state<HTMLElement | null>(null)
  if(datum == null) throw new Error(' `null` `datum`.')
  const { cid, title, type } = datum
  let deleteConfirm = $state<HTMLDialogElement | null>(null)

  const togglePlay = (
    media: HTMLElement | null,
    options?: {
      play?: boolean | null
      pitch?: boolean | null
    }
  ) => {
    const { play = null, pitch = null } = options ?? {}
    if(!(media instanceof HTMLMediaElement)) {
      if(pitch === false) return
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

  const toggleOpen = (
    details: HTMLDetailsElement,
    options?: { open?: boolean | null }
  ) => {
    const { open = null } = options ?? {}
    if((details?.open || open === true) && open !== false) {
      details.open = true
    } else {
      if(debug) console.debug({ closing: details })
      if(!details) return
      details.removeAttribute('open')
      togglePlay(content, { play: false, pitch: false })
    }
  }
</script>

<svelte:document
  onclick={(evt) => {
    if(debug) console.debug({ doc: { clicked: evt.target } })
    if(
      (evt.target as HTMLElement).closest('li')
      != content?.closest('li')
    ) {
      togglePlay(content, { play: false, pitch: false })
    }
  }}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<details
  name="file"
  id="deets-{Math.floor(Math.random() * 1000000)}"
  onclick={(evt) => {
    const details = evt.currentTarget
    if(debug) console.debug({
      clicked: evt.target,
      'child-of': details,
    })
    if(
      evt.target instanceof HTMLMediaElement
      && details.open
    ) {
      togglePlay(content)
      evt.preventDefault()
    } else if(details.open) {
      toggleOpen(details, { open: false })
      evt.preventDefault()
    }
  }}
  onkeypress={(evt) => {
    const details = evt.currentTarget
    if(debug) console.debug({
      '🔑': evt.key,
      open: details.open,
    })
    if(evt.key === 'Escape') {
      toggleOpen(evt.currentTarget, { open: false })
    } else if(evt.key === 'Enter') {
      if(details.open) {
        toggleOpen(details, { open: false })
        evt.preventDefault()
      }
    } else if(evt.key === ' ') {
      try {
        togglePlay(content)
        evt.preventDefault()
      } finally {}
    } else if(evt.key === 'd') {
      deleteConfirm?.showModal()
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
    onkeypress={(evt) => {
      const details = (
        (evt.target as HTMLElement).closest('details')
      )
      if(!details) return
      if(debug) console.debug({
        '🔑': evt.key,
        open: details?.open,
        content,
      })
      console.debug({ summary: content })
      if(evt.key === ' ') {
        if(details.open) togglePlay(content)
        toggleOpen(details, { open: true })
        evt.preventDefault()
      } else if(evt.key === 'd') {
        deleteConfirm?.showModal()
      }
    }}
  >{title}</summary>
  <Display {datum} {content}/>
</details>

<DeleteConfirm
  {datum}
  bind:handle={deleteConfirm}
/>

<style>
  details::before {
    content: "⸬ " counter(entry) " ⸬";
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