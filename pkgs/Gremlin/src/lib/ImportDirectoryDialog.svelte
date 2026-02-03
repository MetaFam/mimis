<script lang="ts">
  import { fileTreeToCIDTree as treeToCIDs } from '$lib/fileTree2CIDTree'
  import settings from '$lib/settings.svelte'
  import { spiderDirHandles } from '$lib/dirHandles2JSTree'
  import {
    expandLevels, filter, isDirNode, metricise, selectAll, walk,
  } from '$lib';
  import { type DirNode, type Node } from '../types'
  import Spinner from '$lib/assets/spinner.svg'
  import Filter from '$lib/assets/filter.svg'
  import Eraser from '$lib/assets/erase.svg'

  let { self = $bindable() } = $props()
  let tree = $state<DirNode>()
  let dir = $state<FileSystemDirectoryHandle>()
  let working = $state(false)
  let regexDialog = $state<HTMLDialogElement>()
  let eraseDialog = $state<HTMLDialogElement>()

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
      const { descendingTo: cidTree } = treeToCIDs(tree)
      console.debug({ cidTree })
    }
    form.reset()
    tree = undefined
    dir = undefined
    self?.close()
  }
  function regexFilter(evt: SubmitEvent) {
    evt.preventDefault()
    const form = evt.currentTarget as HTMLFormElement
    if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
      const formData = new FormData(form)
      const regexString = formData.get('regex')?.valueOf()
      if(!regexString) return
      if(typeof(regexString) !== 'string') {
        throw new Error(`Got a ${typeof(regexString)} regular expression.`)
      }
      const regex = new RegExp(regexString)

      if(tree == null) return
      walk({
        tree,
        walker: {
          descendingTo({ root }: { root: Node }) {
            if(regex.test(root.title)) {
              root.selected = false
            }
          }
        }
      })
    }
    form.reset()
    regexDialog?.close()
  }

  function clearUnselected(evt: SubmitEvent) {
    evt.preventDefault()
    if(!tree) throw new Error('No tree to filter.')
    if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
      const ret = filter({
        tree,
          fn: (node: Node) => (node.selected === false),
      })
      if(isDirNode(ret)) tree = ret
    }
    eraseDialog?.close()
  }
</script>

{#snippet renderNode(node: Node)}
  {@const file = (node.handle instanceof FileSystemFileHandle ? (
    await node.handle?.getFile()
   ) : ( null ))}
  <dl>
    <dt>Selected?</dt>
    <dd
      for="selected"
      onclick={(evt) => {
        evt.preventDefault()
        node.selected = !node.selected
      }}
    >{node.selected ? '✅' : '❌'}</dd>
    <dt>Name</dt>
    <dd for="name">{node.title}</dd  >
    <dt>Size</dt>
    <dd for="size">{metricise(node.size)}</dd>
    <dt id="view">View</dt>
    <dd for="view">
      {#if !!file && node.type === 'file'}
        <object
          data={URL.createObjectURL(file)}
          aria-label={node.title}
        ></object>
      {:else if node.type !== 'directory'}
        {node.type}
      {/if}
    </dd>
  </dl>
{/snippet}

{#snippet fileItem(node: Node, depth: number)}
  <li
    class={node.type}
    style:--depth={depth + 1}
    class:file={node.type === 'file'}
    class:directory={node.type === 'directory'}
  >
    {#if isDirNode(node) && node.children.length > 0}
      <details open={node.expanded}>
        <summary>{@render renderNode(node)}</summary>
        <ol>
          {#each node.children as child, idx}
            {@render fileItem(child as DirNode, depth + 1)}
          {/each}
        </ol>
      </details>
    {:else}
      {@render renderNode(node)}
    {/if}
  </li>
{/snippet}

{#snippet listFiles({ tree, id }: { tree: DirNode, id?: string })}
  <ol id={id}>
    {@render fileItem(tree, 0)}
  </ol>
{/snippet}

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
    <form onsubmit={doImport}>
      <fieldset>
        <legend>Files to Import</legend>
        {@render listFiles({ tree, id: 'files' })}
        <menu>
          <button name="action" value="import">Import</button>
          <button name="action" value="cancel">Cancel</button>
          <div class="spacer"></div>
          <button
            type="button"
            title="Erase Unselected"
            onclick={() => {
              eraseDialog?.showModal()
            }}
          ><img src={Eraser} alt="erase"/></button>
          <button
            type="button"
            title="Filter"
            onclick={() => {
              regexDialog?.showModal()
            }}
          ><img src={Filter} alt="filter"/></button>
        </menu>
      </fieldset>
    </form>
  {/if}
</dialog>

<dialog bind:this={regexDialog}>
  <form onsubmit={regexFilter}>
    <fieldset>
      <legend>Regex to Unselect</legend>
      <input name="regex"/>
      <menu>
        <button name="action" value="import">Unselect</button>
        <button name="action" value="cancel">Cancel</button>
      </menu>
    </fieldset>
  </form>
</dialog>

<dialog bind:this={eraseDialog}>
  <form onsubmit={clearUnselected}>
    <fieldset>
      <legend>Clear Unselected</legend>
      <menu>
        <button name="action" value="clear">Clear</button>
        <button name="action" value="cancel">Cancel</button>
      </menu>
    </fieldset>
  </form>
</dialog>

<style>
  dialog.wide {
    width: 90%;
  }

  div.spacer {
    display: inline-block;
    flex-grow: 1;
  }

  fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    padding: 1em;
  }

  legend {
    margin-inline-start: min(3vw, 10%);
  }

  #files {
    display: grid;
    grid-template-columns: repeat(3, min-content) repeat(2, 1fr);
    gap: 0.5em;
    margin: 0;
    --icon-size: calc(var(--zoom, 1) * 3em);

    & ol, & li, & dl, & details, & summary, ::details-content {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      align-items: center;
    }

    summary:hover, li.file:hover {
      background-color: light-dark(yellow, #9993)
    }

    & ol {
      list-style: none;
      place-items: center;
      margin: 0;
      padding: 0;
    }

    & li {
      width: 100%;
      margin: 0;
    }

    & summary::marker {
      display: inline-block;
      grid-column: 2;
    }

    & dl {
      & dt {
        display: none;
      }
      & dd {
        margin-inline: 0em;

        &[for="selected"] {
          grid-column: 1;
        }
        &[for="name"] {
          grid-column: 4;
          grid-row: 1;
        }
        &[for="size"] {
          grid-column: -1;
          justify-self: end;
        }
        &[for="view"] {
          grid-column: 3;
          grid-row: 1;
          justify-items: center;
        }

        & object {
          display: inline-block;
          max-width: var(--icon-size);
          height: var(--icon-size);
          resize: both;
          overflow: auto;
          padding-inline-start: calc(var(--depth, 1) * 1.5em);
        }
      }
    }

    & .directory > details > summary > dl > dd[for="view"]::before {
      content: url('$lib/assets/folder.svg');
      display: inline-block;
      max-width: var(--icon-size);
      height: var(--icon-size);
      padding-inline-start: calc((var(--depth, 1) - 1) * 1.5em);
    }

    & .directory > details:open > summary > dl > dd[for="view"]::before {
      content: url('$lib/assets/folder.open.svg');
    }
  }

  button img {
    height: 1.5em;
    width: 2em;
    color: light-dark(darkblue, aliceblue);
  }

  form {
    & menu {
      display: flex;
      flex-direction: row-reverse;
      justify-content: flex-start;
      gap: 0.5em;
      margin: 0;
      margin-block-start: 1rem;
    }
  }
</style>