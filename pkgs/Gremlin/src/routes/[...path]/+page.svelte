<script lang="ts">
  import { untrack } from 'svelte'
  import { page } from '$app/state'
  import { afterNavigate, goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import ConfigDialog from '#lib/components/ConfigDialog.svelte'
  import ErrorDialog from '#lib/components/ErrorDialog.svelte'
  import CSSRange from '#lib/components/CSSRange.svelte'
  import SIWE from '#lib/components/SIWE.svelte'
  import NewSpot from '#lib/components/NewSpot.svelte'
  import ImportDirectoryDialog, {
  } from '#lib/components/ImportDirectoryDialog.svelte'
  import FileView from '#lib/components/FileView.svelte'
  import settings from '#lib/settings.svelte.js'
  import { janusToDAG } from '#lib/janus2DAG.js'
  import { graphToCSV } from '#lib/janus2CSV.js'
  import { toHTTP, logHeader, within } from '#lib'
  import { partsOf } from '#lib/search.js'
  import Eyes from '#lib/assets/infinity eyes.svg'
  import Background from '#lib/assets/background.svg'
    import NewFiles from '#lib/components/NewFiles.svelte';

  let errorMsg = $state<string | null>(null)
  let path = $state(
    page.params.path?.split('/').filter(Boolean) ?? []
  )
  let dualPanes = $state(false)
  let query = $state('')
  let addSpotDialog = $state<HTMLDialogElement>()
  let addFilesDialog = $state<HTMLDialogElement>()
  let importDirectoryDialog = $state<HTMLDialogElement>()
  let logDialog = $state<HTMLDialogElement>()
  let configDialog = $state<HTMLDialogElement>()
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
      resolve(path.length > 0 ? `${path.join('/')}/` : ''),
      { reset: false },
    )
  })

  async function copyEditorToken() {
    try {
      const res = await fetch('/api/auth/token')
      if(!res.ok) {
        throw new Error(`Token request failed: HTTP ${res.status}.`)
      }
      const { token } = await res.json() as { token: string }
      await navigator.clipboard.writeText(token)
    } catch(err) {
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
  <menu id="actions" class="popover" popover>
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
        disabled={!whoAmI}
        onclick={copyEditorToken}
        title="For the editor’s “Mïmis: Set Token” command"
      >
        Copy Editor Token
      </button></li>
      <li><button
        aria-disabled={!whoAmI}
        onclick={buildCAR}
      >Export to CAR</button></li>
      <li><button onclick={buildDAG}>Export to CBOR-DAG</button></li>
      <li><button onclick={graphToCSV}>Export to CSV</button></li>
      <li class="search">
        <form onsubmit={(evt) => { evt.preventDefault() }}>
          <input
            type="search"
            bind:value={query}
            onkeydown={(evt) => {
              if(evt.key !== 'ArrowDown') return
              evt.preventDefault()
              document.querySelector<HTMLAnchorElement>('#search-results a')
              ?.focus()
            }}
          />
          <button>🔎</button>
        </form>
      </li>
      <li>
        <form onsubmit={(evt) => { evt.preventDefault() }}>
          <label>
            <input type="checkbox" bind:checked={dualPanes}/>
            Dual Panes
          </label>
        </form>
      </li>
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
  <nav id="locations" class="popover" popover>
    <ul id="system">
      <li><a href={resolve('')}>Root</a></li>
      <li>Recent</li>
      <li>Categories</li>
      <li>Volumes</li>
    </ul>
    <ul id="user">
      <li><a href={resolve('media/book/by/')}>Books</a></li>
      <li><a href={resolve('media/movies/entitled/')}>
        Movies
      </a></li>
      <!--
      <li><a
        href={resolve('television/episodes/ordered/by/internet release/')}
      >
        Latest TV
      </a></li>
      -->
      <li><a href={
        resolve('science/biology/papers/ordered/by/publication date/')
      }>
        Biology Papers
      </a></li>
      <li><button type="button">➕</button></li>
    </ul>
  </nav>
  <FileView bind:path bind:query me={whoAmI}/>
  {#if dualPanes}
    <!-- Hidden, not unmounted, so it keeps its own position. -->
    <FileView
      path={untrack(() => [...path])}
      me={whoAmI}
      hidden={partsOf(query).length > 0}
    />
  {/if}
  <nav>
    <menu id="tools">
      <button
        id="hamburger"
        class="tool"
        popovertarget="actions"
        title="Actions"
      >
        <span>🢗</span><span>
          {#if !whoAmI}
            🔒
          {:else}
            ☰
          {/if}
        </span><span>🢗</span>
      </button>
      <button
        id="flag"
        class="tool"
        popovertarget="locations"
        title="Locations"
      >
        <span>🢗</span><span></span><span>🢗</span>
      </button>
    </menu>
  </nav>

  <NewSpot
    bind:self={addSpotDialog}
    {path}
    onerror={(msg: string) => (
      errorMsg = msg
    )}
  />
  <NewFiles
    bind:self={addFilesDialog}
    {path}
    onerror={(msg: string) => (
      errorMsg = msg
    )}
  />

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

  button.tool {
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
    padding: 0.15rem 0.5rem;
    border: 2px solid transparent;
    border-radius: 0.25rem;
    corner-shape: scoop;
    margin-inline : auto;

    &:hover {
      background-color: #999C;
      border: 2px solid light-dark(#333, #CCC);
    }
  }

  main {
    display: flex;
    min-height: 100dvh;
  }

  #hamburger {
    anchor-name: --hamburger;

    & > span {
      transition: rotate 0.5s, translate 0.5s;
      transform-box: fill-box;
      transform-origin: center;

      &:nth-of-type(1) {
        rotate: 180deg;
        translate: -0.2em -0.6em;
      }
      &:nth-of-type(3) {
        rotate: -180deg;
        translate: 0.2em -0.6em;
      }
    }

    :global(body:has(#actions:popover-open) &) {
      & > span {
        &:nth-of-type(1) {
          rotate: 0deg;
          translate: -0.2em 0.75em;
        }
        &:nth-of-type(3) {
          rotate: 0deg;
          translate: 0.2em 0.75em;
        }
      }
    }
  }

  #actions {
    position-anchor: --hamburger;
    white-space: nowrap;
    border-style: dotted;
    margin-inline: 0;

    & ul {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    & li {
      display: flex;
      justify-content: center;
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

  #flag {
    anchor-name: --flag;

    & > span {
      transition: rotate 0.5s, translate 0.5s;
      transform-box: fill-box;
      transform-origin: center;

      &:nth-of-type(2)::after {
        content: '⚐';
      }
      &:nth-of-type(1) {
        rotate: 180deg;
        translate: -0.2em -0.6em;
      }
      &:nth-of-type(3) {
        rotate: -180deg;
        translate: 0.2em -0.6em;
      }
    }

    :global(body:has(#locations:popover-open) &) {
      & > span {
        opacity: 1;

        &:nth-of-type(1) {
          rotate: 0deg;
          translate: -0.2em 0.75em;
        }
        &:nth-of-type(2)::after {
          content: '⚑';
        }
        &:nth-of-type(3) {
          rotate: 0deg;
          translate: 0.2em 0.75em;
        }
      }
    }
  }

  .popover {
    inset: auto;
    top: anchor(bottom);
    right: anchor(right);
    position: absolute;
    margin: 0;
    interpolate-size: allow-keywords;
    padding: 0.25em;
  }

  #locations {
    position-anchor: --flag;
    white-space: nowrap;
    margin-inline: 0;
    border-style:dotted;

    & ul {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    & li {
      display: flex;
      justify-content: center;
    }
  }

  .search form {
    position: relative;
    display: flex;
    flex-grow: 1;

    & input {
      flex-grow: 1;
      field-sizing: content;
      max-width: min(calc(100dvw - 1ch - 2em - 2ch), auto);

      &::-webkit-search-cancel-button {
        margin-inline-start: 0.5em;
      }
    }
  }

  nav:has(#tools) {
    position: absolute;
    right: 0;
  }

  #tools {
    display: flex;
    margin: 0;

    & button {
      min-width: 4em;
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