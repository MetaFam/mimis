<script lang="ts">
  import { fileTreeToCIDTree as treeToCIDs } from '$lib/fileTree2CIDTree'
  import settings from '$lib/settings.svelte'
  import { spiderDirHandles } from '$lib/dirHandles2JSTree'
  import { expandLevels, selectAll } from '$lib'
  import { type DirNode, type Node } from '../types'
  import Spinner from '$lib/assets/spinner.svg'
  import { cidTreeToJanus } from '$lib/cidTree2Janus'
  import FileTree from './FileTree.svelte';

  let { self = $bindable(), containerId } = $props()
  let tree = $state<DirNode>()
  let dir = $state<FileSystemDirectoryHandle>()
  let working = $state(false)

  const log = (msg: any) => {
    if(settings.debugging) {
      console.debug(msg)
    }
  }

  async function beginSpider(evt: SubmitEvent) {
    evt.preventDefault()
    working = true
    try {
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        tree = await spiderDirHandles({
          dir, log, gitignores: !!formData.get('gitignores'),
        })
        if(!tree) throw Error('Spider returned no tree.')
        selectAll(tree)
        expandLevels({ tree, levels: 1 })
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
    if(!tree) throw new Error('No tree to import.')
    const form = evt.currentTarget as HTMLFormElement
    if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
      const { descendingTo: cidTree } = await treeToCIDs(tree)
      console.debug({ cidTree, containerId })
      cidTreeToJanus({ tree: cidTree, containerId })
    }
    form.reset()
    tree = undefined
    dir = undefined
    self?.close()
  }
</script>

<dialog id="begin-dir" class:wide={!!tree} bind:this={self}>
  {#if typeof(window) === 'undefined' || typeof(window.showDirectoryPicker) !== 'function'}
    <form onsubmit={(evt) => self.close()}>
      <p>¡Many sorries! Your browser does not support <code>showDirectoryPicker()</code>, so it is not possible to spider the file system.</p>
      <menu>
        <button name="action" value="acquiesce">OK</button>
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
          dir = await window.showDirectoryPicker()
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
          <button name="action" value="spider">
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
    <FileTree {tree} onsubmit={doImport} id="files"/>
  {/if}
</dialog>

<style>
</style>