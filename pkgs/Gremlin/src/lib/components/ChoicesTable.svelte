<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { place, ranking } from '#lib/remotes/ranking.remote.js'
  import { listing, type Content } from '#lib/remotes/listing.remote.js'
  import { addFiles } from '#lib/ipfs.js'
  import { RANK_DRAG, toHTTP } from '#lib'
  import { sizeOf } from '#lib/size.js'

  let {
    path,
    contents,
    onerror = () => {},
  }: {
    path: Array<string>
    /** The listing’s Contents, shown until, or if, ranking can’t be had. */
    contents: Array<Content>
    onerror?: (msg: string) => void
  } = $props()

  type Row = Content & { own?: boolean }

  let busy = $state(false)
  /** The place a dragged row would take. */
  let over = $state<number | null>(null)

  const message = (err: unknown) => (
    isHttpError(err) ? err.body.message : (err as Error).message
  )

  async function move(content: Row['id'], index: number) {
    busy = true
    try {
      await place({ path, content, index })
    } catch(err) {
      onerror(message(err))
    } finally {
      busy = false
    }
  }

  /** Each file becomes a new Content of this Spot, ranked last (FR-017). */
  async function addAlternatives(files: Array<File>) {
    if(files.length === 0) return
    busy = true
    try {
      await addFiles({ path, files, alternative: true, onto: true })
      ranking({ path }).refresh()
      listing({ path }).refresh()
    } catch(err) {
      onerror(message(err))
    } finally {
      busy = false
    }
  }
</script>

{#snippet table(rows: Array<Row>, ranked: boolean)}
  <table class="choices">
    <caption>Choices, best first</caption>
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">Preview</th>
        <th scope="col">Type</th>
        <th scope="col">Size</th>
        {#if ranked}
          <th scope="col">Layer</th>
          <th scope="col"><span class="hidden">Move</span></th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each rows as { id, cid, type, size, own }, index (id)}
        <!--
          A row dropped on another takes its place. Anything else,
          such as dropped files, falls through to the page.
        -->
        <tr
          draggable={ranked && !busy}
          class:over={over === index}
          ondragstart={(evt) => {
            evt.dataTransfer?.setData(RANK_DRAG, String(id))
            if(evt.dataTransfer) evt.dataTransfer.effectAllowed = 'move'
          }}
          ondragover={(evt) => {
            if(!ranked || !evt.dataTransfer?.types.includes(RANK_DRAG)) return
            evt.preventDefault()
            over = index
          }}
          ondragleave={() => {
            if(over === index) over = null
          }}
          ondragend={() => over = null}
          ondrop={(evt) => {
            over = null
            const dragged = evt.dataTransfer?.getData(RANK_DRAG)
            if(!ranked || !dragged) return
            evt.preventDefault()
            evt.stopPropagation()
            const what = rows.find((row) => String(row.id) === dragged)
            if(what && what.id !== id) move(what.id, index)
          }}
        >
          <td class="rank">{index + 1}</td>
          <td class="preview">
            {#if type.startsWith('image/')}
              <img src={toHTTP({ cid })} alt="" draggable="false"/>
            {:else}
              <a href={toHTTP({ cid })} rel="external" target="_blank">View</a>
            {/if}
          </td>
          <td class="type">{type}</td>
          <td class="size">{sizeOf(size)}</td>
          {#if ranked}
            <td class="owner">{own ? 'yours' : 'mounted'}</td>
            <td class="move">
              <button
                title="Move up"
                disabled={busy || index === 0}
                onclick={() => move(id, index - 1)}
              >↑</button>
              <button
                title="Move down"
                disabled={busy || index === rows.length - 1}
                onclick={() => move(id, index + 1)}
              >↓</button>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<section class="alternatives">
  {#await ranking({ path })}
    {@render table(contents, false)}
  {:then ranked}
    {@render table(ranked, true)}
  {:catch err}
    {@render table(contents, false)}
    <p class="note">{message(err)}</p>
  {/await}
  <label>
    Add an alternative…
    <input
      type="file"
      multiple
      disabled={busy}
      onchange={(evt) => {
        const files = [...(evt.currentTarget.files ?? [])]
        evt.currentTarget.value = ''
        addAlternatives(files)
      }}
    />
  </label>
</section>

<style>
  .alternatives {
    width: 100%;
    padding: 0.5em;

    & table {
      width: 100%;
      border-collapse: collapse;
    }

    & caption {
      text-align: start;
      font-weight: bold;
    }

    & th, & td {
      padding: 0.25em 0.5em;
      text-align: start;
      border-bottom: 1px solid #9994;
    }

    & tr[draggable="true"] {
      cursor: grab;
    }

    & tr.over {
      outline: 2px dashed currentColor;
    }

    & .rank, & .size {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }

    & img {
      height: 3em;
      width: 3em;
      object-fit: contain;
    }

    & .owner, & .note {
      font-size: 0.75em;
      opacity: 0.75;
    }

    & .hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
</style>
