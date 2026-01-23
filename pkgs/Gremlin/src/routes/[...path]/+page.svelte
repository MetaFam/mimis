<script lang="ts">
  import { page } from '$app/state'
  import { afterNavigate } from '$app/navigation'
  import { searchFor, type Entry } from '$lib/searchFor.remote'
  import { createSpot } from '$lib/createSpot.remote'
  import { addFiles } from '$lib/addFiles.remote'
  import { spotId } from '$lib/spotId.remote'
  import ConfigDialog from '$lib/ConfigDialog.svelte'
  import CSSRange from '$lib/CSSRange.svelte'
  import Breadcrumbs from '$lib/Breadcrumbs.svelte'
  import folder from '$lib/assets/folder.svg'
  import settings from '$lib/settings.svelte'
  import { kuboUpload } from '$lib/ipfs'
  import { toHTTP, valueOrThrow } from '$lib'

  let path = $state(page.params.path?.split('/').filter(Boolean) ?? [])
  let files = $derived(valueOrThrow(await searchFor({ path })) as Array<Entry>)
  let menued = $state(false)
  let addSpotModal = $state<HTMLDialogElement>()
  let addFilesModal = $state<HTMLDialogElement>()
  let configModal = $state<HTMLDialogElement>()
  let containerId = $derived(valueOrThrow(await spotId({ path })) as number)

  afterNavigate(async ({ to }) => {
    path = (
      to?.url.pathname.split('/').map(decodeURI).filter(Boolean) ?? []
    )
  })

  async function processSpot(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      if(containerId == null) {
        throw new Error('No Container Specified: ¡I don’t know where I am!')
      }
      if(!addSpotModal) throw new Error('¿How was this directory submitted?')
      const formData = new FormData(evt.currentTarget as HTMLFormElement)
      const path = formData.getAll('path') as Array<string>
      valueOrThrow(await createSpot({ containerId, path }))
      addSpotModal.requestClose()
    } catch(error) {
      console.error({ error })
    }
  }

  async function processFiles(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      if(containerId == null) {
        throw new Error('No Container Specified: ¡I don’t know where I am!')
      }
      if(!addFilesModal) throw new Error('¿How were these files submitted?')
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      const files = formData.getAll('files') as Array<File>
      const cids = await kuboUpload({ files })
      const entries = cids.map((entry, idx) => ({
        ...entry,
        name: files[idx].name,
        size: files[idx].size,
      }))
      valueOrThrow(await addFiles({
        containerId,
        files: entries,
      }))
      form.reset()
      addFilesModal.requestClose()
    } catch(error) {
      console.error({ error })
    }
  }
</script>

<svelte:head>
  <title>ï: {path}</title>
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
      <input type="search"/>
    </section>
    <nav class="system locations">
      <ul>
        <li><a href="/">Root</a></li>
        <li>Recent</li>
        <li>Categories</li>
        <li>Volumes</li>
      </ul>
    </nav>
    <nav class="user locations">
      <ul>
        <li><a href="/media/book/by/">Books</a></li>
        <li><a href="/media/movies/entitled/">Movies</a></li>
        <!-- <li><a href="/television/eposodes/ordered/by/internet release/">Latest TV</a></li> -->
        <li><a href="/science/biology/papers/ordered/by/publication date/">Biology Papers</a></li>
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
        {#each files as { name, type, cid }}
          <li>
            {#if type === "spot"}
              <a
                href="{path.length > 0 ? '/' : ''}{path.join('/')}/{name}"
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

      &:hover {
        color: lch(from LinkText calc(l + 10) calc(c - 10) calc(h + 180));
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