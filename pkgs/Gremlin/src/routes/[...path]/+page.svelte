<script lang="ts">
  import { untrack } from 'svelte'
  import { isHttpError } from '@sveltejs/kit'
  import { page } from '$app/state'
  import { afterNavigate, goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import ConfigDialog from '$lib/components/ConfigDialog.svelte'
  import ErrorDialog from '$lib/components/ErrorDialog.svelte'
  import CSSRange from '$lib/components/CSSRange.svelte'
  import SIWE from '$lib/components/SIWE.svelte'
  import ImportDirectoryDialog, {
  } from '$lib/components/ImportDirectoryDialog.svelte'
  import FileView from '$lib/components/FileView.svelte'
  import settings from '$lib/settings.svelte'
  import { janusToDAG } from '$lib/janus2DAG'
  import { graphToCSV } from '$lib/janus2CSV'
  import { addFiles } from '$lib/ipfs'
  import { upsertSpot } from '$lib/remotes/upsertSpot.remote'
  import { toHTTP, logHeader, within } from '$lib'
  import Eyes from '$lib/assets/infinity eyes.svg'
  import Background from '$lib/assets/background.svg'

  let errorMsg = $state<string | null>(null)
  let path = $state(
    page.params.path?.split('/').filter(Boolean) ?? []
  )
  let menued = $state(false)
  let addSpotDialog = $state<HTMLDialogElement>()
  let addFilesDialog = $state<HTMLDialogElement>()
  let importDirectoryDialog = $state<HTMLDialogElement>()
  let logDialog = $state<HTMLDialogElement>()
  let configDialog = $state<HTMLDialogElement>()
  let filesInput = $state<FileList>()
  let pathInput = $state<string>('')
  let logs = $state<Array<string>>([])
  let whoAmI = $state<string | null>(null)

  logHeader()

  $effect(() => {
    const dialogs = document.querySelectorAll('dialog')
    dialogs.forEach((dialog) => {
      dialog.addEventListener('click', (evt) => {
        if(evt.target === dialog && !within(dialog, evt)) {
          dialog.close()
        }
      })
    })
  })

  afterNavigate(async ({ to }) => {
    path = (
      to?.url.pathname
      .split('/')
      .map(decodeURI)
      .filter(Boolean)
      ?? []
    )
  })

  $effect(() => {
    const current = (
      page.url.pathname.split('/').map(decodeURI).filter(Boolean)
    )
    if(current.join('/') === path.join('/')) return
    goto(
      resolve((path.length > 0 ? `/${path.join('/')}/` : '/') as '/'),
      { replaceState: false, noScroll: true, keepFocus: true },
    )
  })

  async function addSpot(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      if(!addSpotDialog) throw new Error('¿How was this directory submitted?')

      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        const terminal = formData.getAll('path') as Array<string>
        await upsertSpot({ container: path, subdirectory: terminal })
      }
      addSpotDialog.requestClose()
      form.reset()
    } catch(err) {
      errorMsg = (err as Error).message
      if(isHttpError(err)) {
        errorMsg = `HTTP Error: ${err.status}: ${err.body.message}`
      }
      console.error({ 'addSpot func': err, errorMsg })
    }
  }

  async function filesAdded(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      if(!addFilesDialog) throw new Error('¿How were these files submitted?')
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        const files = formData.getAll('files') as Array<File>
        await addFiles({ files, path })
      }
      addFilesDialog.requestClose()
      form.reset()
    } catch(err) {
      console.error({ 'addFiles func': err })
      errorMsg = (err as Error).message
    }
  }

  async function buildDAG() {
    const { cid, log } = await build(
      { generateCAR: false, insertInIPFS: true }
    )
    log(
      'Update built with root CID:'
      + ` <a href="${toHTTP({ cid })}" target="_blank">`
      + cid.toString()
      + '</a>'
    )
 }

  async function buildCAR() {
    const { car: { url } = {}, log } = await build(
      { generateCAR: true, insertInIPFS: false }
    )
    log(
      'Update built to CAR:'
      + ` <a href="${url}" target="_blank" download>`
      + url
      + '</a>'
    )
   }

  async function build(opts: unknown) {
    logDialog?.showModal()
    const log = (msg: unknown) => {
      logs.unshift(msg as string)
    }
    if(typeof opts !== 'object' || opts == null) {
      throw new Error('Invalid build options.')
    }
    const result = await janusToDAG({ log, ...opts })
    return { ...result, log }
  }
</script>

<svelte:head>
  <title>ï: {path.at(-1)}</title>
  <link rel="icon" href={Eyes}/>
</svelte:head>

<main>
  <menu id="actions" class:open={menued}>
    <ul>
      <li><button
        disabled={!whoAmI}
        commandfor="add-spot"
        command="show-modal"
      >
        Add Directory
      </button></li>
      <li><button
        disabled={!whoAmI}
        commandfor="add-files"
        command="show-modal"
      >
        Import Files
      </button></li>
      <li><button
        disabled={!whoAmI}
        commandfor="begin-dir"
        command="show-modal"
      >
        Import Directory
      </button></li>
      <li><button
        aria-disabled={!whoAmI}
        onclick={buildCAR}
      >Export to CAR</button></li>
      <li><button onclick={buildDAG}>Export to CBOR-DAG</button></li>
      <li><button onclick={graphToCSV}>Export to CSV</button></li>
      <li><a class="button" href={resolve('/graph')}>Force Graph</a></li>
      <li><button
        class="menu-open"
        commandfor="config"
        command="show-modal"
      >
        Settings
      </button></li>
      <li>
        <CSSRange
          min={0.1} max={2} step={0.1}
          property="--zoom" label="🔎"
          bind:value={settings.detailsZoom}
        />
      </li>
      <li id="bg">
        <img class="icon" src={Background} alt="background"/>
        <input
          type="color"
          oninput={(evt) => {
            document.documentElement.style.setProperty(
              '--display-color', (evt.target as HTMLInputElement)?.value
          )
          }}
        />
      </li>
      <li><SIWE bind:me={whoAmI}/></li>
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
        <li><a href={resolve('/media/book/by/')}>Books</a></li>
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
  <FileView bind:path me={whoAmI}/>
  <FileView path={untrack(() => [...path])} me={whoAmI}/>
  <dialog id="add-spot" bind:this={addSpotDialog}>
    <form onsubmit={addSpot} class="adder">
      <fieldset>
        <legend>Path to New Spot</legend>
        <input
          name="path"
          bind:value={pathInput}
        />
        <menu>
          <button
            name="action"
            value="add"
            disabled={pathInput?.trim() === ''}
          >Add</button>
          <button
            type="button"
            command="close"
            commandfor="add-spot"
          >Cancel</button>
        </menu>
      </fieldset>
    </form>
  </dialog>
  <dialog id="add-files" bind:this={addFilesDialog}>
    <form onsubmit={filesAdded} class="adder">
      <fieldset>
        <legend>Files to Add</legend>
        <input
          bind:files={filesInput}
          name="files"
          type="file"
          multiple
        />
        <menu>
          <button
            name="action"
            value="add"
            disabled={(filesInput ?? []).length < 1}
          >Add</button>
          <button
            type="button"
            command="close"
            commandfor="add-files"
          >Cancel</button>
        </menu>
      </fieldset>
    </form>
  </dialog>
  <dialog id="logs" bind:this={logDialog}>
    <form>
      <ol reversed>
        {#each logs as log, idx (logs.length - idx)}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <li>{@html log}</li>
        {/each}
      </ol>
      <menu>
        <button
          type="button"
          command="close"
          commandfor="logs"
        >Close</button>
        <span class="spacer"></span>
      </menu>
    </form>
  </dialog>
  <ImportDirectoryDialog
    bind:self={importDirectoryDialog}
    {path}
  />
  <ConfigDialog bind:self={configDialog}/>
  <ErrorDialog bind:error={errorMsg}/>
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

  .general.tools > button {
    margin-inline-start: 0;
    transition: all 0.5s;

    & > span {
      display: inline-block;
      rotate: 0deg;

      &:nth-of-type(odd) {
        translate: 0em 0.25em;
      }
    }
  }

  .general.tools > button.actions-open {
    margin-inline-start: -25%;

    & > span {
      rotate: 90deg;

      &:nth-of-type(1) {
        translate: -0.85em 0em;
      }
      &:nth-of-type(3) {
        translate: -0.2em 0em;
      }
    }
  }

  button[disabled], button[aria-disabled="true"] {
    opacity: 0.5;
    pointer-events: none;
  }

  ul {
    padding: 0;
    list-style: none;
  }

  #actions button, #actions a.button {
    display: block;
    color: inherit;
    background-color: buttonface;
    padding: 0.5rem 1rem;
    border: 1px solid #333;
    border-radius: 0.5rem;
    margin-bottom: 0.25rem;
    margin-inline : auto;

    &:hover {
      background-color: #999C;
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
    padding-inline: 0;
    margin-inline: 0;
    margin-block-start: 3em;
    border-inline-end: 2px solid #3330;

    & ul {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    & li {
      display: flex;
      justify-content: center;
    }

    &.open {
      width: max-content;
      padding-inline-end: 0.5rem;
      margin-inline-end: 0.5rem;
      border-inline-end: 2px solid #333;
    }

    & #bg {
      display: flex;
      justify-content: center;

      & .icon {
        max-width: 1.5em;
      }

      & input[type="color"] {
        flex-grow: 1;
        height: 2em;
      }
    }
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
        padding-inline: 1.5em 0em;
        field-sizing: content;

        &::-webkit-search-cancel-button {
          margin-inline-start: 0.5em;
        }
      }
    }
  }

  a {
    text-decoration: none;
  }

  #add-spot input {
    field-sizing: content;
    min-width: 15ch;
    padding: 0.25em 0.5em;
  }

  #logs {
    margin-inline-start: 4rem;

    & form {
      max-height: 90dvh;
      display: flex;
      flex-direction: column;
    }

    & ol {
      overflow-y: scroll;
    }
  }
</style>