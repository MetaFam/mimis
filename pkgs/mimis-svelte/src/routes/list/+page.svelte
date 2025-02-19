<script lang="ts" module>
  export type Entry = {
    id: number
    cid: string
    title: string
    type?: string
  }
</script>

<script lang="ts" >
  import Toastify from 'toastify-js'
  import { create as createIPFS } from 'kubo-rpc-client'
  import { SortableList } from 'svelte-pragmatic-sortable'
  import type { Version } from 'multiformats'
  import { settings } from '$lib/settings.svelte'
  import row from './Line.svelte'
  import preview from './Preview.svelte'
    import { tick } from 'svelte';

  let entries = $state<Array<Entry>>([])
  let ipfs = createIPFS(settings.ipfsAPI)
  let loading = $state(false)
  let saving = $state(false)
  let changes = $state(false)
  let history = $state<Array<Array<Entry>>>([])
  let progress = $state(0)
  let total = $state(0)
  let count = $state(0)

  async function addEntries(
    files: File | Array<File>
  ) {
    if(!Array.isArray(files)) files = [files]
    total = (
      files.reduce((acc, { size }) => acc + size, 0)
    )
    const options = {
      chunker: 'rabin',
      cidVersion: 1 as Version,
      progress: (bytes: number) => {
        progress += bytes
      },
    }
    let infos = []
    let idx = 0
    const results = await ipfs.addAll(files, options)
    for await (const { cid } of results) {
      infos.push({
        id: ++count,
        cid: cid.toString(),
        title: (
          files[idx].name.replace(/\.[^.]*$/, '')
        ),
        type: files[idx].type,
      })
      idx++
    }
    const existing = entries.map(({ cid }) => cid)
    const unique = infos.filter((info) => (
      !existing.includes(info.cid)
    ))
    entries = entries.concat(unique)
  }

  async function handleFiles(evt: Event) {
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

  function save() {
    try {
      saving = true
    } finally {
      saving = false
    }
  }

  function undo() {
    if(history.length === 0) return
    document.startViewTransition(async () => {
      const prev = history.pop()!
      entries = prev
      changes = history.length > 0

      await tick()
    })
  }
</script>

<svelte:head>
  <title>Mïmis: Merge List</title>
  <meta
    name="description"
    content={
      'Ordered list of files to be combined with others'
      + ' in the same namespace.'
    }
  />
</svelte:head>

<svelte:document
  ondatum-delete={(evt: CustomEvent) => {
    const { id } = evt.detail
    entries = entries.filter((entry) => entry.id !== id)
  }}
/>

<header>
  <h1>Merge List</h1>
</header>

<main>
  <form>
    <label>
      <button
        id="add-file"
        type="button"
        onclick={(evt) => {(
          evt.currentTarget.form
          ?.elements
          .namedItem('toAdd') as HTMLInputElement
        ).click()}}
        disabled={loading}
      >
        {#if loading}
          <section>
            <p>Loading…</p>
            <progress max={total} value={progress}>
              {progress / total * 100}%
            </progress>
          </section>
        {:else}
          Add a File
        {/if}
      </button>
      <input
        type="file"
        accept="image/*,video/*"
        name="toAdd"
        multiple
        onchange={handleFiles}
      />
    </label>
    <section id="controls">
      <button
        id="save"
        type="button"
        onclick={save}
        disabled={!changes || saving}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        id="undo"
        type="button"
        onclick={undo}
        disabled={history.length === 0 || saving}
      >
        Undo
      </button>
    </section>
  </form>

  <SortableList id="entries" bind:data={entries} bind:history {row} {preview}/>
</main>

<style>
  :root {
    interpolate-size: allow-keywords;
    --bg: var(--color, currentColor);
  }
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  button {
    z-index: 10;
  }
  button#add-file {
    position: sticky;
    top: 3rem;
  }
  section#controls {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
  }
  input[type=file] {
    opacity: 0;
    position: absolute;
  }

  :global(.sortable-list) {
    counter-reset: entry;
    list-style: none;
    margin-block: 2rem;
    margin-inline: auto;
    width: 420px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 2px solid var(--bg);
    border-radius: 0.5rem;
    padding: 0.5rem;

    & li {
      position: relative;
      border: 2px solid var(--bg);
      border-radius: 0.5rem;
      padding: 0.5rem;

      &:hover {
        background-color: color-mix(in oklab, var(--bg), transparent);
        cursor: grab;
      }
    }

    & li                 { --bg: cyan }
    & li:nth-of-type(1)  { --bg: color-mix(in oklab, red, #FFF 25%) }
    & li:nth-of-type(2)  { --bg: color-mix(in oklab, red, #FFF 15%) }
    & li:nth-of-type(3)  { --bg: color-mix(in oklab, red, #FFF 5%) }
    & li:nth-of-type(4)  { --bg: color-mix(in oklab, red, #FFF 0%) }
    & li:nth-of-type(5)  { --bg: color-mix(in oklab, red, #000 10%) }
    & li:nth-of-type(6)  { --bg: color-mix(in oklab, red, #000 20%) }
    & li:nth-of-type(7)  { --bg: color-mix(in oklab, red, #000 30%) }
    & li:nth-of-type(8)  { --bg: color-mix(in oklab, red, #000 40%) }
    & li:nth-of-type(9)  { --bg: color-mix(in oklab, red, #000 60%) }
    & li:nth-of-type(10) { --bg: color-mix(in oklab, red, #000 75%) }
    & li:nth-of-type(11) { --bg: color-mix(in oklab, orange, #FFF 25%) }
    & li:nth-of-type(12) { --bg: color-mix(in oklab, orange, #FFF 15%) }
    & li:nth-of-type(13) { --bg: color-mix(in oklab, orange, #FFF 5%) }
    & li:nth-of-type(14) { --bg: color-mix(in oklab, orange, #FFF 0%) }
    & li:nth-of-type(15) { --bg: color-mix(in oklab, orange, #000 10%) }
    & li:nth-of-type(16) { --bg: color-mix(in oklab, orange, #000 20%) }
    & li:nth-of-type(17) { --bg: color-mix(in oklab, orange, #000 30%) }
    & li:nth-of-type(18) { --bg: color-mix(in oklab, orange, #000 40%) }
    & li:nth-of-type(19) { --bg: color-mix(in oklab, orange, #000 60%) }
    & li:nth-of-type(20) { --bg: color-mix(in oklab, orange, #000 75%) }
    & li:nth-of-type(21) { --bg: color-mix(in oklab, yellow, #FFF 25%) }
    & li:nth-of-type(22) { --bg: color-mix(in oklab, yellow, #FFF 15%) }
    & li:nth-of-type(23) { --bg: color-mix(in oklab, yellow, #FFF 5%) }
    & li:nth-of-type(24) { --bg: color-mix(in oklab, yellow, #FFF 0%) }
    & li:nth-of-type(25) { --bg: color-mix(in oklab, yellow, #000 10%) }
    & li:nth-of-type(26) { --bg: color-mix(in oklab, yellow, #000 20%) }
    & li:nth-of-type(27) { --bg: color-mix(in oklab, yellow, #000 30%) }
    & li:nth-of-type(28) { --bg: color-mix(in oklab, yellow, #000 40%) }
    & li:nth-of-type(29) { --bg: color-mix(in oklab, yellow, #000 60%) }
    & li:nth-of-type(30) { --bg: color-mix(in oklab, yellow, #000 75%) }
    & li:nth-of-type(31) { --bg: color-mix(in oklab, green, #FFF 25%) }
    & li:nth-of-type(32) { --bg: color-mix(in oklab, green, #FFF 15%) }
    & li:nth-of-type(33) { --bg: color-mix(in oklab, green, #FFF 5%) }
    & li:nth-of-type(34) { --bg: color-mix(in oklab, green, #FFF 0%) }
    & li:nth-of-type(35) { --bg: color-mix(in oklab, green, #000 10%) }
    & li:nth-of-type(36) { --bg: color-mix(in oklab, green, #000 20%) }
    & li:nth-of-type(37) { --bg: color-mix(in oklab, green, #000 30%) }
    & li:nth-of-type(38) { --bg: color-mix(in oklab, green, #000 40%) }
    & li:nth-of-type(39) { --bg: color-mix(in oklab, green, #000 60%) }
    & li:nth-of-type(40) { --bg: color-mix(in oklab, green, #000 75%) }
    & li:nth-of-type(41) { --bg: color-mix(in oklab, cyan, #FFF 25%) }
    & li:nth-of-type(42) { --bg: color-mix(in oklab, cyan, #FFF 15%) }
    & li:nth-of-type(43) { --bg: color-mix(in oklab, cyan, #FFF 5%) }
    & li:nth-of-type(44) { --bg: color-mix(in oklab, cyan, #FFF 0%) }
    & li:nth-of-type(45) { --bg: color-mix(in oklab, cyan, #000 10%) }
    & li:nth-of-type(46) { --bg: color-mix(in oklab, cyan, #000 20%) }
    & li:nth-of-type(47) { --bg: color-mix(in oklab, cyan, #000 30%) }
    & li:nth-of-type(48) { --bg: color-mix(in oklab, cyan, #000 40%) }
    & li:nth-of-type(49) { --bg: color-mix(in oklab, cyan, #000 60%) }
    & li:nth-of-type(50) { --bg: color-mix(in oklab, cyan, #000 75%) }
    & li:nth-of-type(51) { --bg: color-mix(in oklab, blue, #FFF 25%) }
    & li:nth-of-type(52) { --bg: color-mix(in oklab, blue, #FFF 15%) }
    & li:nth-of-type(53) { --bg: color-mix(in oklab, blue, #FFF 5%) }
    & li:nth-of-type(54) { --bg: color-mix(in oklab, blue, #FFF 0%) }
    & li:nth-of-type(55) { --bg: color-mix(in oklab, blue, #000 10%) }
    & li:nth-of-type(56) { --bg: color-mix(in oklab, blue, #000 20%) }
    & li:nth-of-type(57) { --bg: color-mix(in oklab, blue, #000 30%) }
    & li:nth-of-type(58) { --bg: color-mix(in oklab, blue, #000 40%) }
    & li:nth-of-type(59) { --bg: color-mix(in oklab, blue, #000 60%) }
    & li:nth-of-type(60) { --bg: color-mix(in oklab, blue, #000 75%) }
    & li:nth-of-type(61) { --bg: color-mix(in oklab, indigo, #FFF 25%) }
    & li:nth-of-type(62) { --bg: color-mix(in oklab, indigo, #FFF 15%) }
    & li:nth-of-type(63) { --bg: color-mix(in oklab, indigo, #FFF 5%) }
    & li:nth-of-type(64) { --bg: color-mix(in oklab, indigo, #FFF 0%) }
    & li:nth-of-type(65) { --bg: color-mix(in oklab, indigo, #000 10%) }
    & li:nth-of-type(66) { --bg: color-mix(in oklab, indigo, #000 20%) }
    & li:nth-of-type(67) { --bg: color-mix(in oklab, indigo, #000 30%) }
    & li:nth-of-type(68) { --bg: color-mix(in oklab, indigo, #000 40%) }
    & li:nth-of-type(69) { --bg: color-mix(in oklab, indigo, #000 60%) }
    & li:nth-of-type(70) { --bg: color-mix(in oklab, indigo, #000 75%) }
    & li:nth-of-type(71) { --bg: color-mix(in oklab, violet, #FFF 25%) }
    & li:nth-of-type(72) { --bg: color-mix(in oklab, violet, #FFF 15%) }
    & li:nth-of-type(73) { --bg: color-mix(in oklab, violet, #FFF 5%) }
    & li:nth-of-type(74) { --bg: color-mix(in oklab, violet, #FFF 0%) }
    & li:nth-of-type(75) { --bg: color-mix(in oklab, violet, #000 10%) }
    & li:nth-of-type(76) { --bg: color-mix(in oklab, violet, #000 20%) }
    & li:nth-of-type(77) { --bg: color-mix(in oklab, violet, #000 30%) }
    & li:nth-of-type(78) { --bg: color-mix(in oklab, violet, #000 40%) }
    & li:nth-of-type(79) { --bg: color-mix(in oklab, violet, #000 60%) }
    & li:nth-of-type(80) { --bg: color-mix(in oklab, violet, #000 75%) }
    & li:nth-of-type(10n + 1),
    & li:nth-of-type(10n + 2),
    & li:nth-of-type(10n + 3),
    & li:nth-of-type(10n + 4),
    & li:nth-of-type(10n + 5) {
      --fg: color-mix(in oklab, var(--bg), #000 75%);
    }

    :global(li:has(details[open])) {
      --bg: color-mix(in oklab, green, #5555 90%);
    }

    :global(li:focus-within:has(details)) {
      --bg: green;
    }

    & li:hover, :global(li:has(details[open]):hover) {
      --bg: yellow;
    }

    & .drop-indicator {
      background-color: light-dark(blue, lime);
      border-color: light-dark(blue, lime);
    }
  }
</style>
