<script lang="ts">
  import { filter, isDirNode, metricise, walk } from '$lib'
  import type { DirNode, Node } from '../types'
  import Eraser from '$lib/assets/erase.svg'
  import Filter from '$lib/assets/filter.svg'

  let { tree = $bindable(), onsubmit } = $props()
  let regexDialog = $state<HTMLDialogElement>()
  let eraseDialog = $state<HTMLDialogElement>()

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
        fn: (node: Node) => (node.selected !== false),
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
    >{node.selected == null ? '▣' : (node.selected ? '✅' : '❌')}</dd>
    <dt>Name</dt>
    <dd data-for="name">{node.title}</dd  >
    <dt>Size</dt>
    <dd data-for="size">{metricise(node.size, { precision: 1 })}</dd>
    <dt id="view">View</dt>
    <dd data-for="view">
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

<form {onsubmit}>
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
      ><img src={Eraser} alt="erase" style:color="#FFF"/></button>
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
        width: max-content;
        margin-inline: 0em;

        &[data-for="selected"] {
          grid-column: 1;
        }
        &[data-for="name"] {
          grid-column: 4;
          grid-row: 1;
          padding-inline-start: calc((var(--depth, 1) - 1) * 0.5em);
        }
        &[data-for="size"] {
          grid-column: -1;
          justify-self: end;
        }
        &[data-for="view"] {
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

    & .directory > details > summary > dl > dd[data-for="view"]::before {
      content: '';
      background-image: url('$lib/assets/folder.svg');
      background-repeat: no-repeat;
      background-size: contain;
      display: inline-block;
        width: var(--icon-size);
      height: var(--icon-size);
      margin-inline-start: calc(var(--depth, 1) * 1.5em);
    }

    & .directory > details:open > summary > dl > dd[data-for="view"]::before {
      background-image: url('$lib/assets/folder.open.svg');
    }
  }

  button img {
    height: 1.5em;
    width: 2em;
    color: light-dark(darkblue, aliceblue);
  }
</style>