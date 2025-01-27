<script lang="ts" >
  import Toastify from 'toastify-js'
  import { create as createIPFS } from 'kubo-rpc-client'
  import Sortable, {
    type SortableEvent,
  } from 'sortablejs'
  import type { Version } from 'multiformats'
  import { toHTTP } from '$lib/toHTTP'
  import { settings } from "$lib/settings.svelte"

  type Entry = {
    cid: string
    title: string
    type?: string
  }

  let entries = $state<Array<Entry>>([])
  let ipfs = createIPFS(settings.ipfsAPI)
  let loading = $state(false)

  const addEntries = (
    async (files: File | Array<File>) => {
      if(!Array.isArray(files)) files = [files]
      const overall = (
        files.reduce((acc, { size }) => acc + size, 0)
      )
      let txed = 0
      const options = {
        chunker: 'rabin',
        cidVersion: 1 as Version,
        progress: (bytes: number) => {
          txed += bytes
          console.log(
            `Uploaded ${bytes} bytes`
            + ` (${(txed / overall * 100).toFixed(1)}%)`
          )
        },
      }
      let cids = []
      const results = await ipfs.addAll(files, options)
      for await (const { cid } of results) {
        cids.push(cid)
      }
      cids.forEach((cid, idx) => {
        entries.push({
          cid: cid.toString(),
          title: (
            files[idx].name.split('.').slice(0, -1).join('.')
          ),
          type: files[idx].type,
        })
      })
    }
  )
  const handleFiles = async (evt: Event) => {
    try {
      evt.preventDefault()
      loading = true
      const files = (
        (evt.currentTarget as HTMLInputElement)
        ?.files
      )
      if(!files) return
      await addEntries(Array.from(files))
    } catch(err) {
      Toastify({
        text: (err as Error).message,
        duration: 16_000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #1E396A, #F32587)",
        },
      }).showToast()
    } finally {
      loading = false
    }
  }

  let listElem = $state<HTMLOListElement | null>(null)

  $effect(() => {
    if(!listElem) throw new Error('No `#entries` found.')
    new Sortable(listElem, {
      animation: 150,
      chosenClass: 'chosen',

      onStart: (evt: SortableEvent) => {
        const details = evt.item.querySelector('details')
        if(details) details.open = false
      },
    })
  })
</script>

<svelte:head>
  <title>Mïmis: Merge List</title>
  <meta
    name="description"
    content="Ordered list of files to be combined with others in the same namespace."
  />
</svelte:head>

<main>
  <form>
    <label>
      <button
        type="button"
        onclick={(evt) => {(
          evt.currentTarget.form
          ?.elements
          .namedItem('toAdd') as HTMLInputElement
        ).click()}}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Add a File'}
      </button>
      <input
        type="file"
        accept="image/*,video/*"
        name="toAdd"
        multiple
        onchange={handleFiles}
      />
    </label>
  </form>

  <ol id="entries" bind:this={listElem}>
    {#each entries as entry}
      <li><details name="file">
        <summary>{entry.title}</summary>
        <button
          type="button"
          onclick={(evt) => {
            const details = evt.currentTarget.closest('details')
            if(details?.open) { details.open = false }
          }}
        >
          {#if (
            entry.type?.startsWith('image/')
            && !entry.type.endsWith('/svg+xml')
          )}
            <img
              src={toHTTP({ cid: entry.cid })}
              alt={entry.title}
            />
          {:else if entry.type?.startsWith('video/')}
            <video controls>
              <source
                src={toHTTP({ cid: entry.cid })}
                type={entry.type}
              />
              <track kind="captions"/>
            </video>
          {:else}
            <object
              data={toHTTP({ cid: entry.cid })}
              title={entry.title}
            ></object>
          {/if}
        </button>
      </details></li>
    {/each}
  </ol>
</main>

<style>
  :root {
    interpolate-size: allow-keywords;
    --color: var(--barcolor, #B94900);
  }
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  @media (supports: '::details-content') {
    details {
      overflow: hidden;
    }
    details::details-content {
      background: teal;
      block-size: 0;
      transition: block-size 1s, content-visibility 1s;
      transition-behavior: allow-discrete;
    }
    details[open]::details-content {
      block-size: auto;
    }
  }
  #entries {
    list-style-type: decimal;
    margin-top: 1em;
  }
  input[type=file] {
    opacity: 0;
    position: absolute;
  }
  ol {
    counter-reset: entry;
  }
  li {
    position: relative;
  }
  details::before {
    content: "⸬ " counter(entry) " ⸬";
    counter-increment: entry;
    font-weight: bold;
    position: absolute;
    left: 0.5rem;
  }
  details {
    position: relative;
    color: light-dark(
      var(--color),
      color-mix(in oklab, var(--color), #FFF 75%)
    );
    background-color: light-dark(
      color-mix(in oklab, var(--color), #FFF 75%),
      var(--color)
    );
    width: 95vw;
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    padding-inline-start: 4rem;
    margin-block-end: 1em;

    & summary {
      position: relative;
      cursor: pointer;
    }

    & img, & video, & object {
      max-height: 80vh;
      max-width: 90vw;
      display: block;
      margin-inline: auto;
    }
    & object {
      min-width: 50vw;
      pointer-events: none;
    }
  }

  li:nth-of-type(1)  { --color: color-mix(in oklab, red, #FFF 25%) }
  li:nth-of-type(2)  { --color: color-mix(in oklab, red, #FFF 15%) }
  li:nth-of-type(3)  { --color: color-mix(in oklab, red, #FFF 5%) }
  li:nth-of-type(4)  { --color: color-mix(in oklab, red, #FFF 0%) }
  li:nth-of-type(5)  { --color: color-mix(in oklab, red, #000 10%) }
  li:nth-of-type(6)  { --color: color-mix(in oklab, red, #000 20%) }
  li:nth-of-type(7)  { --color: color-mix(in oklab, red, #000 30%) }
  li:nth-of-type(8)  { --color: color-mix(in oklab, red, #000 40%) }
  li:nth-of-type(9)  { --color: color-mix(in oklab, red, #000 60%) }
  li:nth-of-type(10) { --color: color-mix(in oklab, red, #000 75%) }
  li:nth-of-type(11) { --color: color-mix(in oklab, orange, #FFF 25%) }
  li:nth-of-type(12) { --color: color-mix(in oklab, orange, #FFF 15%) }
  li:nth-of-type(13) { --color: color-mix(in oklab, orange, #FFF 5%) }
  li:nth-of-type(14) { --color: color-mix(in oklab, orange, #FFF 0%) }
  li:nth-of-type(15) { --color: color-mix(in oklab, orange, #000 10%) }
  li:nth-of-type(16) { --color: color-mix(in oklab, orange, #000 20%) }
  li:nth-of-type(17) { --color: color-mix(in oklab, orange, #000 30%) }
  li:nth-of-type(18) { --color: color-mix(in oklab, orange, #000 40%) }
  li:nth-of-type(19) { --color: color-mix(in oklab, orange, #000 60%) }
  li:nth-of-type(20) { --color: color-mix(in oklab, orange, #000 75%) }
</style>