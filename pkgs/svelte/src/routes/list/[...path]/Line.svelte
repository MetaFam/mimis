<script lang="ts">
  import type { Entry } from './+page.svelte'
  import DeleteConfirm from './DeleteConfirm.svelte'
  import Display from './Display.svelte'
  import Zoomed from './Zoomed.svelte'
  import context from './context.svelte'

  const { debug } = context

  class NotMediaError extends Error {
    constructor() { super('Not a media element.') }
  }

  let {
    datum = $bindable(null), index, open = $bindable(false)
  }: {
    datum: Entry | null, index: number, open: boolean
  } = $props()
  let summary = $state<HTMLElement | null>(null)
  let content = $state<HTMLElement | null>(null)
  if(datum == null) throw new Error(' `null` `datum`.')
  const { id: itemId, cid, title, type } = datum
  let details = $state<HTMLDetailsElement | null>(null)
  let deleteConfirm = $state<HTMLDialogElement | null>(null)
  let zoomed = $state<HTMLDialogElement | null>(null)
  let editing = $state(false)
  let newTitle = $state(title)
  const { single } = context

  $effect(() => {
    if(index === 0) summary?.focus()
  })

  function togglePlay(
    options?: {
      play?: boolean | null
      pitch?: boolean | null
    }
  ) {
    const { play = null, pitch = null } = options ?? {}
    if(!(content instanceof HTMLMediaElement)) {
      if(pitch === false) return
      if(debug) console.debug({ rejecting: content })
      throw new NotMediaError()
    }
    if((content.paused || play === true) && play !== false) {
      if(debug) console.debug({ playing: content })
      content.play()
    } else {
      if(debug) console.debug({ pausing: content })
      content.pause()
    }
  }
  // @ts-expect-error
  context.register(togglePlay, { itemId })

  function toggleOpen(
    options?: { open?: boolean | null }
  ) {
    if(!details) return
    if(
      (!open || options?.open === true) && options?.open !== false
    ) {
      if(debug) console.debug({ opening: details })
      open = true
    } else {
      if(debug) console.debug({ closing: details })
      open = false
      togglePlay({ play: false, pitch: false })
    }
  }
  // @ts-expect-error
  context.register(toggleOpen, { itemId })

  function isOpen() {
    return open
  }
  context.register(isOpen, { itemId })

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

  function focus() {
    summary?.focus()
  }
  context.register(focus, { itemId })

  function setEditing(value: boolean) {
    editing = value
  }
  // @ts-expect-error
  context.register(setEditing, { itemId })

  function isEditing() {
    return editing
  }
  context.register(isEditing, { itemId })

  function focusOnCreate(node: HTMLElement) {
    if(editing) node.focus()
  }
</script>

<details
  bind:this={details}
  bind:open
  name="file{single ? '' : `-${index + 1}`}"
  id="deets-{index + 1}"
>
  <summary
    id="sum-{index + 1}"
    tabindex={0}
    bind:this={summary}
    onclick={(evt) => {
      if(!editing) {
        evt.preventDefault()
        if(debug) console.debug({ 'summary:onclick': {
          'details.open': details?.open, content, evt, 'var:open': open,
        }})
      }
    }}
    onkeydown={(evt) => {
      if(!editing) evt.preventDefault()
    }}
  >
  {#if editing}
    <form onsubmit={(evt) => {
      evt.preventDefault()
      editing = false
    }}>
      <input name="title" bind:value={datum.title} use:focusOnCreate/>
      <button type="submit">💾</button>
    </form>
  {:else}
    {datum.title} {type?.startsWith('video/') ? '🎬' : ''}
  {/if}
  </summary>
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
    cursor: grab;
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

  form {
    display: inline;
  }
</style>