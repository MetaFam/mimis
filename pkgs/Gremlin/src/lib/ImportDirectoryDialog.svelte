<script lang="ts">
  import settings from './settings.svelte'
  import { spiderDirHandles } from '$lib/dirHandles2JSTree'
  import { type DirNode, type Node } from '../types'
  import Folder from '$lib/assets/folder.svg'

  let { self = $bindable() } = $props()
  let tree = $state<DirNode>()
  let dir = $state<FileSystemDirectoryHandle>()

  const log = (msg: any) => {
    if(settings.debugging) {
      console.debug(msg)
    }
  }

  async function beginSpider(evt: SubmitEvent) {
    evt.preventDefault()
    const form = evt.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
      tree = await spiderDirHandles({
        dir, log, gitignores: !!formData.get('gitignores'),
      })
    }
  }
  async function doImport(evt: SubmitEvent) {
    const form = evt.currentTarget as HTMLFormElement
    form.reset()
    self?.close()
  }
</script>

{#snippet renderNode(node: Node)}
  {@const file = (node.handle instanceof FileSystemFileHandle ? (
    await node.handle?.getFile()
  ) : ( null ))}
  <dl>
    <dt>Selected?</dt>
    <dd for="selected">{node.selected ? '✅' : '❎'}</dd>
    <dt>Name</dt>
    <dd for="name">{node.title}</dd  >
    <dt>Size</dt>
    <dd for="size">{node.size.toLocaleString()}B</dd>
    <dt id="view">View</dt>
    {#if node.type === 'directory'}
      <dd for="view"><object data={Folder}/></dd>
    {:else if file}
      <dd for="view"><object
        data={URL.createObjectURL(file)}
        aria-label={node.title}
      ></object></dd>
    {/if}
  </dl>
{/snippet}

{#snippet fileItem(node: DirNode, depth: number)}
  <li class={node.type} style:--depth={depth}>
    {#if node.children?.length > 0}
      <details>
        <summary>{@render renderNode(node)}</summary>
        <ol>
          {#each node.children as child}
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
  {#if !tree}
    <form onsubmit={beginSpider} class="adder">
      <fieldset>
        <legend>Directory to Spider {!!tree}</legend>
        <label>
          <input name="gitignores" type="checkbox" defaultChecked/>
          <span>Respect <code>.gitignore</code> files</span>
        </label>
        <button type="button" onclick={async () => {
          dir = await window.showDirectoryPicker()
        }}>
          {#if dir}
            <q>{dir.name}</q> Selected…
          {:else}
            Select Directory
          {/if}
        </button>
        <menu>
          <button name="action" value="spider">Spider</button>
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
        </menu>
      </fieldset>
    </form>
  {/if}
</dialog>

<style>
  #begin-dir.wide {
    width: 90%;
  }

  fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  #files {
    display: grid;
    grid-template-columns: 1em 2em repeat(3, 1fr);

    & ol, & li, & dl, & details, & summary {
      display: grid;
      grid-template-columns: subgrid;
    }

    & ol {
      list-style: none;
      place-items: center;
      margin: 0;
    }

    & li {
      width: 100%;
    }

    & details::marker {
      display: inline-block;
      grid-column: 2;
    }

    & summary {
      padding-block-start: 0;
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
        }

        & object {
          display: inline-block;
          height: 1.5em;
        }
      }
    }
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