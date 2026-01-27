<script lang="ts">
  // The derived Promises are ugly as hell, but they've
  // resisted several attempts to make them prettier.

  import { page } from '$app/state'
  import { afterNavigate } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { searchFor, type Entry } from '$lib/searchFor.remote'
  import { createSpot } from '$lib/createSpot.remote'
  import { addFiles } from '$lib/addFiles.remote'
  import { spotId } from '$lib/spotId.remote'
  import ConfigDialog from '$lib/ConfigDialog.svelte'
  import ErrorDialog from '$lib/ErrorDialog.svelte'
  import CSSRange from '$lib/CSSRange.svelte'
  import Breadcrumbs from '$lib/Breadcrumbs.svelte'
  import settings from '$lib/settings.svelte'
  import { kuboUpload } from '$lib/ipfs'
  import { toHTTP, throwError } from '$lib'
  import folder from '$lib/assets/folder.svg'

  let error = $state<string | null>(null)
  let path = $state(
    page.params.path?.split('/').filter(Boolean) ?? []
  )
  let menued = $state(false)
  let addSpotModal = $state<HTMLDialogElement>()
  let addFilesModal = $state<HTMLDialogElement>()
  let configModal = $state<HTMLDialogElement>()
  // https://svelte.dev/docs/svelte/runtime-warnings#Client-warnings-await_waterfall
  let spotsPromise = $derived(searchFor({ path }))
  let idPromise = $derived(spotId({ path }))
  let idOrError = $derived(
    await idPromise
  ) as number | { error: string }

  afterNavigate(async ({ to }) => {
    path = (
      to?.url.pathname
      .split('/')
      .map(decodeURI)
      .filter(Boolean)
      ?? []
    )
  })

  async function processSpot(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      const containerId = throwError(idOrError) as number
      if(containerId == null) {
        throw new Error('No Container Specified: ¡I don’t know where I am!')
      }
      if(!addSpotModal) throw new Error('¿How was this directory submitted?')
      const formData = new FormData(evt.currentTarget as HTMLFormElement)
      const path = formData.getAll('path') as Array<string>
      throwError(await createSpot({ containerId, path }))
      addSpotModal.requestClose()
    } catch(err) {
      console.error({ err })
      error = (err as Error).message
    }
  }

  async function processFiles(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      const containerId = throwError(idOrError) as number
      if(containerId == null) {
        throw new Error('No Container Specified: ¡I don’t know where I am!')
      }
      if(!addFilesModal) throw new Error('¿How were these files submitted?')
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      const files = formData.getAll('files') as Array<File>
      const cids = throwError(
        await kuboUpload({ files })
      ) as Array<Entry>
      const entries = cids.map((entry, idx) => {
        if(entry.cid == null) throw new Error('No CID.')
        return {
          ...entry,
          cid: entry.cid,
          name: files[idx].name,
          size: files[idx].size,
        }
      })
      console.debug({ entries })
      throwError(await addFiles({
        containerId,
        files: entries,
      }))
      form.reset()
      addFilesModal.requestClose()
    } catch(err) {
      console.error({ err })
      error = (err as Error).message
    }
  }

  const display = async () => {
    try {
      const spots = throwError(
        await spotsPromise
      ) as Array<Entry>
      console.debug(JSON.stringify(spots, null, 2))
      return spots
    } catch(err) {
      console.error({ err })
      error = (err as Error).message
    }
  }
</script>

<svelte:head>
  <title>ï: {path.at(-1)}</title>
</svelte:head>

<main>
  <menu id="actions" class:open={menued}>
    <ul>
      <li><button onclick={() => addSpotModal?.showModal()}>
        Add Directory
      </button></li>
      <li><button onclick={() => addFilesModal?.showModal()}>
        Import Files
      </button></li>
      <li><button>Import Directory</button></li>
      <li><button>Export to CAR</button></li>
      <li><button>Export to CBOR-DAG</button></li>
      <li><button
        class="menu-open"
        onclick={() => configModal?.showModal()}
      >
        Settings
      </button></li>
      <li>
        <CSSRange
          min={0.1} max={1.5} step={0.1}
          property="--zoom" label="🔎"
          bind:value={settings.detailsZoom}
        />
      </li>
    </ul>
  </menu>
  <section id="locations">
    <section class="general tools">
      <button
        onclick={() => menued = !menued}
        class:actions-open={menued}
        title="{menued ? 'Close' : 'Open'} Actions"
      >
        <span>🢗</span><span>☰</span><span>🢗</span>
      </button>
      <section class="search">
        <input type="search"/>
      </section>
    </section>
    <nav class="system locations">
      <ul>
        <li><a href={resolve('/')}>Root</a></li>
        <li>Recent</li>
        <li>Categories</li>
        <li>Volumes</li>
      </ul>
    </nav>
    <nav class="user locations">
      <ul>
        <li><a
          href={resolve('/media/book/by/')}>Books</a></li>
        <li><a href={resolve('/media/movies/entitled/')}>
          Movies
        </a></li>
        <!--
        <li><a
          href={resolve('/television/episodes/ordered/by/internet release/')}
        >
          Latest TV
        </a></li>
        -->
        <li><a href={
          resolve('/science/biology/papers/ordered/by/publication date/')
        }>
          Biology Papers
        </a></li>
        <li><button type="button">➕</button></li>
      </ul>
    </nav>
  </section>
  <section id="files">
    <nav id="crumbs">
      <Breadcrumbs {path}/>
    </nav>
    <nav id="details">
      <ul>
        {#each await display() as { name, type, cid } (cid || name)}
          <li>
            {#if type === "spot"}
              <a
                href={resolve(
                  `${
                    path.length > 0 ? '/' : ''
                  }${
                    path.join('/')
                  }/${
                    name
                  }` as '/'
                )}
                title={name}
              >
                <img src={folder} alt="📁"/>
                <span>{name}</span>
              </a>
            {:else if type === 'image' && cid}
              <img src={toHTTP({ cid })} alt={name}/>
              <span>{name}</span>
            {:else}
              <aside>Unknown Type: {type}</aside>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
  </section>
  <dialog id="add-spot" bind:this={addSpotModal}>
    <form onsubmit={processSpot}>
      <fieldset>
        <legend>Path to New Spot</legend>
        <input name="path" value=""/>
        <button>Add</button>
      </fieldset>
    </form>
  </dialog>
  <dialog id="add-files" bind:this={addFilesModal}>
    <form onsubmit={processFiles}>
      <fieldset>
        <legend>Files to Add</legend>
        <input name="files" type="file" multiple/>
        <button>Add</button>
      </fieldset>
    </form>
  </dialog>
  <ConfigDialog bind:self={configModal}/>
  {#if error}
    <ErrorDialog bind:error={error}/>
  {/if}
</main>

<style>
  :root {
    color-scheme: light dark;
    font-size: 1.1em;
    --zoom: 0.5;
  }

  :global(body) {
    margin: 0;
  }

  input, button {
    font-size: 1em;
  }

  .general.tools > button > span {
    display: inline-block;
    transition: all 0.5s;
    rotate: 0deg;

    &:nth-of-type(odd) {
      translate: 0em 0.25em;
    }
  }

  .general.tools > button.actions-open > span {
    rotate: 90deg;

    &:nth-of-type(1) {
      translate: -0.85em 0em;
    }
    &:nth-of-type(3) {
      translate: -0.2em 0em;
    }
  }

  ul {
    padding: 0;
    list-style: none;

    #locations & li, #actions & button {
      display: block;
      padding: 0.5rem 1rem;
      border: 1px solid #333;
      border-radius: 0.5rem;
      margin-bottom: 0.25rem;
      margin-inline : auto;
    }
  }

  main {
    display: flex;
    height: 100dvh;
  }

  #actions {
    width: 0;
    overflow-x: hidden;
    transition: width 0.75s cubic-bezier(0.4, 0.0, 0.2, 1);
    interpolate-size: allow-keywords;
    white-space: nowrap;
    padding-inline-end: 0;
    margin-inline-end: 0;
    border-inline-end: 2px solid #3330;

    &.open {
      width: max-content;
      padding-inline-end: 0.5rem;
      margin-inline-end: 0.5rem;
      border-inline-end: 2px solid #333;
    }
  }

  #details {
    flex-grow: 1;
  }

  .general.tools {
    display: flex;

    & button {
      min-width: 4em;
    }

    .search {
      position: relative;
      display: flex;

      &::before {
        content: '🔎';
        position: absolute;
        top: calc(50% - 1ex);
        left: 0.25em;
      }

      & input {
        padding-inline-start: 1.5em;
      }
    }
  }

  #add-spot input {
    field-sizing: content;
    min-width: 5ch;
    padding: 0.25em 0.5em;
  }

  #files, #crumbs {
    display: flex;
    flex-grow: 1;
  }

  #files {
    flex-direction: column;
    align-self: start;
  }

  #crumbs {
    border: 2px dashed #999;

    & ol {
      margin: 0em;
      padding: 0.1em;
    }
  }

  #details {
    flex-grow: 1;

    & > ul {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 1em;
    }

    & a {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      align-items: center;

      &:hover {
        color: lch(
          from LinkText calc(l + 10) calc(c - 10) calc(h + 180)
        );
      }
    }

    & img {
      width: calc(var(--zoom, 1) * 15em);
      max-height: calc(var(--zoom, 1) * 10em);
    }

    & span {
      display: inline-block;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 3;
      -webkit-line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }
  }
</style>