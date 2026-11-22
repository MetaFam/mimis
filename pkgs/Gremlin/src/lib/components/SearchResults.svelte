<script lang="ts">
  import { resolve } from '$app/paths'
  import { navigateOnClick, toHTTP } from '#lib'
  import { searchSpots } from '#lib/remotes/searchSpots.remote.js'
  import { PAGE_SIZE, partsOf } from '#lib/search.js'
  import Folder from '#assets/folder.svg'

  let {
    path = $bindable([]),
    query = $bindable(''),
  }: {
    path: Array<string>
    query: string
  } = $props()

  const PAUSE_MS = 150

  let settled = $state<Array<string> | null>(null)
  $effect(() => {
    const parts = partsOf(query)
    const timer = setTimeout(() => settled = parts, PAUSE_MS)
    return () => clearTimeout(timer)
  })

  const search = $derived(JSON.stringify([path, settled]))
  let shown = $state({ search: '', pages: 1 })
  const pages = $derived(shown.search === search ? shown.pages : 1)
  const offsets = $derived(
    Array.from({ length: pages }, (_, idx) => idx * PAGE_SIZE)
  )

  const choose = (names: Array<string>) => (
    navigateOnClick({
      target: [...path, ...names],
      set: (next) => {
        path = next
        query = ''
        document.getElementById('actions')?.hidePopover()
      },
    })
  )

  function step(evt: KeyboardEvent) {
    const by = { ArrowDown: 1, ArrowUp: -1 }[evt.key]
    if(by == null) return
    const links = [
      ...(evt.currentTarget as HTMLElement).querySelectorAll('ol a'),
    ] as Array<HTMLAnchorElement>
    const at = links.indexOf(document.activeElement as HTMLAnchorElement)
    if(at < 0) return
    evt.preventDefault()
    links[Math.min(Math.max(at + by, 0), links.length - 1)].focus()
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
  id="search-results"
  aria-label="Search results"
  onkeydown={step}
>
  <header>
    Spots matching <output>{query}</output>
    <button
      type="button"
      class="clear"
      aria-label="Clear search"
      onclick={() => query = ''}
    >✕</button>
  </header>
  {#if settled == null}
    <p role="status">Searching…</p>
  {:else}
    {@const parts = settled}
    <ol>
      {#each offsets as offset, idx (offset)}
        {#await searchSpots({ path, parts, offset })}
          {#if idx === 0}
            <li role="status">Searching…</li>
          {/if}
        {:then { results, more }}
          {#if idx === 0 && results.length === 0}
            <li role="status">Nothing matched</li>
          {/if}
          {#each results as { id, names, thumb, types } (id)}
            <li>
              <a
                href={resolve(`${[...path, ...names].join('/')}/`)}
                onclick={choose(names)}
              >
                {#if thumb?.type.startsWith('video/')}
                  <video
                    class="thumb"
                    src={toHTTP({ cid: thumb.cid })}
                    muted
                    preload="metadata"
                  ></video>
                {:else if thumb}
                  <img class="thumb" src={toHTTP({ cid: thumb.cid })} alt=""/>
                {:else if types.length === 0}
                  <img class="thumb folder" src={Folder} alt=""/>
                {/if}
                {names.join('/')}/
              </a>
            </li>
          {/each}
          {#if more && idx === offsets.length - 1}
            <li>
              <button
                type="button"
                class="more"
                onclick={() => shown = { search, pages: pages + 1 }}
              >Show more</button>
            </li>
          {/if}
        {:catch err}
          <li role="alert">{(err as Error)?.message ?? String(err)}</li>
        {/await}
      {/each}
    </ol>
  {/if}
</section>

<style>
  #search-results {
    flex-grow: 1;
    padding: 0.5em;
  }

  header {
    display: flex;
    align-items: center;
    gap: 0.5ch;
  }

  output {
    font-weight: bold;
  }

  ol {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 0em;
  }

  a {
    display: flex;
    align-items: center;
    padding: 0.1em;
    border-radius: 0.1em;
    gap: 1ch;
    transition-property: color, background-color;
    transition-duration: 0.25s;

    &:hover {
      color: light-dark(#09308b, #a9efc5);
      background-color: light-dark(#ffda06, #890089);
    }
  }

  .thumb {
    width: 2em;
    height: 2em;
    object-fit: cover;

    &.folder {
      object-fit: contain;
    }
  }
</style>
