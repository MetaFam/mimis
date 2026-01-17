<script lang="ts">
  import { page } from '$app/state'
  import { searchFor } from '$lib/searchFor.remote'
  import { createSpot } from '$lib/createSpot.remote'
  import ConfigDialog from '$lib/ConfigDialog.svelte'

  const path = page.params.path?.split('/') ?? []
  let files = $state(await searchFor({ path }))
  let menued = $state(false)
  let addSpotModal = $state<HTMLDialogElement>()
  let addFilesModal = $state<HTMLDialogElement>()
  let configModal = $state<HTMLDialogElement>()

  async function processSpot(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      const formData = new FormData(evt.currentTarget as HTMLFormElement)
      const path = formData.getAll('path') as Array<string>
      await createSpot({ path })
      if(!addSpotModal) throw new Error('¿How was this directory submitted?')
      addSpotModal.requestClose()
    } catch(error) {
      console.error({ error })
    }
  }

  async function processFiles(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      const formData = new FormData(evt.currentTarget as HTMLFormElement)
      const files = formData.getAll('files') as Array<string>
      console.debug({ files })
      if(!addFilesModal) throw new Error('¿How were these files submitted?')
      addFilesModal.requestClose()
    } catch(error) {
      console.error({ error })
    }
  }

  function addSpot() {
    addSpotModal?.showModal()
  }
  function addFiles() {
    addFilesModal?.showModal()
  }
  function openSettings() {
    configModal?.showModal()
  }
</script>

<svelte:head>
  <title>ï: {path}</title>
</svelte:head>

<main>
  <menu id="actions" class:open={menued}>
    <ul>
      <li><button onclick={addSpot}>Add Directory</button></li>
      <li><button onclick={addFiles}>Import File</button></li>
      <li><button>Import Directory</button></li>
      <li><button>Export to CAR</button></li>
      <li><button>Export to CBOR-DAG</button></li>
      <li><button class="menu-open" onclick={openSettings}>
        Settings
      </button></li>
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
        <li>Root</li>
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
  <section id="details">
    <nav>
      <ul>
        {#each Object.entries(files) as [path, id]}
          <li>{path} ({id})</li>
        {/each}
      </ul>
    </nav>
  </section>
  <dialog id="add-spot" bind:this={addSpotModal}>
    <form onsubmit={processSpot}>
      <fieldset>
        <legend>Path to New Spot</legend>
        {#each path as element}
          <input name="path" value={element}/>
        {/each}
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

    & #actions {
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

    & #details {
      flex-grow: 1;
    }

    & .general.tools {
      display: flex;
    }

    #add-spot input {
      field-sizing: content;
      min-width: 5ch;
      padding: 0.25em 0.5em;
    }
  }
</style>