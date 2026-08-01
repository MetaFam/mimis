<script lang="ts">
  import { fileTreeToCIDTree as treeToCIDs, type TreeNode } from '$lib/fileTree2CIDTree'
  import settings from '$lib/settings.svelte'
  import { spiderDirHandles } from '$lib/dirHandles2JSTree'
  import { expandLevels, selectAll } from '$lib'
  import Spinner from '$lib/assets/spinner.svg'
  import { cidTreeToJanus } from '$lib/cidTree2Janus'
  import FileTree from '$lib/FileTree.svelte'
  import { searchFor } from '$lib/remotes/searchFor.remote'
  import { spotId } from '$lib/remotes/spotId.remote'
  import { type DirNode } from '../types'

  let { self = $bindable(), path } = $props()
  let tree = $state<DirNode>()
  let dir = $state<FileSystemDirectoryHandle>()
  let working = $state(false)
  let logs = $state<Array<unknown>>([])

  const log = (msg: unknown) => {
    logs.unshift(msg)
  }

  async function beginSpider(evt: SubmitEvent) {
    evt.preventDefault()
    working = true
    try {
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        log?.(`Spidering ${dir?.name}:`)
        tree = await spiderDirHandles({
          dir, log, gitignores: Boolean(formData.get('gitignores')),
        })
        if(!tree) throw Error('Spider returned no tree.')
        selectAll(tree)
        expandLevels({ tree, levels: 1 })
        logs = []
      } else {
        dir = undefined
        self?.close()
      }
    } finally {
      working = false
    }
  }
  async function doImport(evt: SubmitEvent) {
    evt.preventDefault()
    try {
      if(!tree) throw new Error('No tree to import.')
      const form = evt.currentTarget as HTMLFormElement
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        const {
          descendingTo: cidTree
        } = await treeToCIDs(tree, { log }) as {
          descendingTo: TreeNode
        }
        await cidTreeToJanus({
          tree: cidTree,
          containerId: await spotId({ path }),
          log,
        })
      }
      log?.('Import complete.')
      form.reset()
      await searchFor({ path }).refresh()
    } catch(err) {
      let msg = (err as Error).message
      if(msg === 'Failed to fetch') {
        msg = `Unable to connect to IPFS daemon @ ${settings.ipfsAPI}.`
      }
      log(msg)
    }
  }
  function close() {
    tree = undefined
    dir = undefined
    self?.close()
  }
</script>

<dialog id="begin-dir" class:wide={!!tree} bind:this={self}>
  {#if typeof(window) === 'undefined' || typeof(window.showDirectoryPicker) !== 'function'}
    <form onsubmit={() => self.close()}>
      <p>¡Many sorries! Your browser does not support <code>showDirectoryPicker()</code>, so it is not possible to spider the file system.</p>
      <menu>
        <button name="action" value="acquiesce">OK</button>
      </menu>
    </form>
  {:else if logs.length > 0}
    <form class="logs">
      <ol reversed>
        {#each logs as log, idx (logs.length - idx)}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <li>{@html log}</li>
        {/each}
      </ol>
      <menu>
        <button
          type="button"
          name="action" value="clear"
          onclick={() => {
            logs = []
            if(tree) close()
          }}
        >Clear</button>
        <div class="spacer"></div>
      </menu>
    </form>
  {:else if !tree}
    <form onsubmit={beginSpider} class="adder">
      <fieldset>
        <legend>Directory to Spider</legend>
        <label>
          <input name="gitignores" type="checkbox" defaultChecked/>
          <span>Respect <code>.gitignore</code> files</span>
        </label>
        <button type="button" onclick={async () => {
          working = true
          // @ts-expect-error: showDirectoryPicker can take an argument
          dir = await window.showDirectoryPicker({ mode: 'read' })
          working = false
        }}>
          {#if dir}
            <q>{dir.name}</q> Selected…
          {:else if working}
            <img src={Spinner} alt="spin"/>
          {:else}
            Select Directory
          {/if}
        </button>
        <menu>
          <button name="action" value="spider" disabled={!dir}>
            {#if working}
              <img src={Spinner} alt="spin"/>
            {:else}
              Spider
            {/if}
          </button>
          <button name="action" value="cancel">Cancel</button>
        </menu>
      </fieldset>
    </form>
  {:else}
    <FileTree {tree} onsubmit={doImport} oncancel={close}/>
  {/if}
</dialog>

<style>
  button img {
    width: 1em;
    max-height: 1em;
  }

  #begin-dir fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  .logs {
    display: flex;
    flex-direction: column;
    margin-inline-start: 1rem;

    & ol {
      max-height: calc(100dvh - 7.5em);
      overflow-y: scroll;

      & li {
        margin-inline-start: 5em;
      }
    }
  }
</style>