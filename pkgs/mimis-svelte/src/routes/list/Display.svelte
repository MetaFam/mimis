<script lang="ts">
  import { page } from "$app/state";
  import { toHTTP } from "$lib/toHTTP";

  const debug = !!page.url.searchParams.get('debug')

  let {
    datum,
    content = $bindable(),
  } = $props()
  const { cid, title, type } = datum

  let mime = $derived.by(() => {
    if(type == null) return 'undefined'

    const [_, klass, ext] = (
      Array.from(type.match(/^([^/]+)\/(.*)$/) ?? [])
    )
    if(debug) console.debug({ klass, ext })
    if(ext !== 'svg+xml') {
      return klass
    } else {
      return 'object'
    }
  })
</script>

{#if mime === 'image'}
  <img
    bind:this={content}
    src={toHTTP({ cid })}
    alt={title}
  />
{:else if mime === 'audio'}
  <audio
    controls
    bind:this={content}
    tabindex={-1}
  >
    <source
      src={toHTTP({ cid })}
      {type}
    />
  </audio>
{:else if mime === 'video'}
  <video
    controls
    bind:this={content}
    tabindex={-1}
  >
    <source
      src={toHTTP({ cid })}
      {type}
    />
    <track kind="captions"/>
  </video>
{:else}
  <object
    bind:this={content}
    data={toHTTP({ cid })}
    {title}
    {type}
  >
    <p>Your browser can't render an <code>&lt;object&gt;</code> of type <q>{type}</q>.</p>
  </object>
{/if}

<style>
  img, video, object {
    max-height: var(--max-height, 80vh);
    max-width: 90%;
    display: block;
    margin-inline: auto;
    border-radius: 0.5rem;
    border: 2px solid color-mix(in oklab, var(--bg), #0009 90%);
    pointer-events: none;
  }
  object {
    min-width: 50%;
  }
</style>