<script lang="ts" module>
  export type Entry = {
    cid: string
    title: string
    type?: string
  }
  export type IdedEntry = Entry & { id: number }

  declare global {
    namespace svelteHTML {
      interface DocumentEventMap {
        'datum-delete': CustomEvent<{ id: number }>
      }
    }
  }
</script>

<script lang="ts" >
  import Toastify from 'toastify-js'
  import type { Version } from 'multiformats'
  import { tick } from 'svelte'
  import JSON5 from 'json5'
  import { create as createStoracha } from '@storacha/client'
  import type { EmailAddress } from '@storacha/client/types'
  import { assets } from '$app/paths'
  import { page } from '$app/state'
  import { settings } from '$lib/settings.svelte'
  import { list2Neo4j } from '$lib/list2Neo4j'
  import { neo4j2List } from '$lib/neo4j2List'
  import { getIPFS } from '$lib/drivers'
  import { identify } from '$lib';
  import SortableList from './SortableList.svelte'
  import Shortcuts from './Shortcuts.svelte'
  import context from './context.svelte'
  import Path from './Path.svelte'
  import 'toastify-js/src/toastify.css'

  const { debug } = context

  let entries = $state<Array<IdedEntry>>([])
  let ipfs = getIPFS()
  let loading = $state(false)
  let saving = $state(false)
  let changes = $state(false)
  let history = $state<Array<Array<IdedEntry>>>([])
  let progress = $state(0)
  let total = $state(0)
  let addFiles = $state<HTMLInputElement | null>(null)
  let loadFiles = $state<HTMLInputElement | null>(null)
  let shortcuts = $state<HTMLDialogElement | null>(null)
  let path = $state<Array<string>>(
    (page.params.path?.split('/') ?? []).filter(Boolean)
  )
  if(path.length === 0) path.push('')

  const hasPath = $derived(
    path.filter((pos) => pos.trim() !== '').length > 0
  )

  const alert = (msg: string, opts = {}) => {
    Toastify({
      text: msg,
      duration: 16_000,
      close: true,
      gravity: 'bottom', // `top` or `bottom`
      position: 'center', // `left`, `center` or `right`
      stopOnFocus: true, // prevents dismissing while hovered
      style: {
        background: "linear-gradient(to right, #1E396A, #F32587)",
      },
      ...opts,
    }).showToast()
  }

  async function saveLocalIPFS(files: Array<File>) {
    const options = {
      chunker: 'rabin',
      cidVersion: 1 as Version,
      progress: (bytes: number) => {
        progress += bytes
      },
      timeout: 60_000,
    }
    const total = (
      files.reduce((acc, { size }) => acc + size, 0)
    )
    if(debug) console.debug({ Adding: files, 'Total Size': total, options })
    let infos = []
    let idx = 0
    for await (const { cid } of ipfs.addAll(files, options)) {
      if(debug) {
        console.debug({ 'Added Local': { cid, file: files[idx].name } })
      }
      infos.push({
        cid: cid.toString(),
        title: (
          files[idx].name.replace(/\.[^.]*$/, '')
        ),
        type: files[idx].type,
      })
      idx++
    }
    return identify(infos)
  }

  async function saveStoracha(files: Array<File>) {
    const storacha = await createStoracha()
    if(!settings.storachaEmail) {
      throw new Error('No Storacha email specified in settings.')
    }
    const account = await storacha.login(
      settings.storachaEmail as EmailAddress
    )
    let space: { did: () => `did:${string}:${string}` } | undefined = (
      storacha.spaces().find((s) => s.name === "Mïmis")
    )
    if(!space) {
      space = await storacha.createSpace("Mïmis", { account })
    }
    if(!space) {
      throw new Error('Couldn’t find or create space: "Mïmis".')
    }
    await storacha.setCurrentSpace(space.did())
    const entries = await Promise.all(files.map(async (file) => {
      const cid = await storacha.uploadFile(file, { dedupe: true })
      return {
        cid: cid.toString(),
        title: (
          file.name.replace(/\.[^.]*$/, '')
        ),
        type: file.type,
      }
    }))

    return identify<Entry>(entries)
  }

  async function addEntries(
    files: File | Array<File>
  ) {
    try {
      if(!Array.isArray(files)) files = [files]

      const infos = (settings.saveLocal ? (
        await saveLocalIPFS(files)
      ) : (
        await saveStoracha(files)
      ))
      if(debug) console.debug({ Added: infos })
      const firstId = infos[0].id
      const existing = entries.map(({ cid }) => cid)
      const unique = infos.filter(({ cid }) => (
        !existing.includes(cid)
      ))
      if(debug) console.debug({ infos, 'Unique Entries': unique })
      entries = entries.concat(unique)

      await tick()

      const first = document.querySelector(
        `[data-element-id="${firstId}"] summary`
      )
      ;(first as HTMLElement)?.focus()
    } catch(err) {
      console.error({ 'IPFS Add Error': err })
      if((err as { response?: { status: number } }).response?.status === 0) {
        throw new Error('Couldn’t connect to IPFS.')
      } else {
        throw err
      }
    }
  }

  async function loadConfigs(files: File[]) {
    const configs = await Promise.all(
      files.map(async (file) => ( JSON5.parse(await file.text()) ))
    )
    entries = identify<Entry>(configs.flat())
  }

  async function handleFiles(
    evt: Event, func: (files: File[]) => void,
  ) {
    try {
      evt.preventDefault()
      loading = true
      const files = (
        (evt.currentTarget as HTMLInputElement)?.files
      )
      if(!files) return
      await func.call(func, Array.from(files))
      changes = entries.length > 0
    } catch(err) {
      alert((err as Error).message)
    } finally {
      loading = false
    }
  }

  function save() {
    try {
      saving = true
      console.debug({ save: { entries, path } })
      list2Neo4j(entries, path)
    } finally {
      saving = false
    }
  }
  context.register(save)

  async function load() {
    try {
      saving = true
      entries = await neo4j2List(path)
    } finally {
      saving = false
    }
  }
  context.register(load)

  function undo() {
    if(history.length === 0) return
    const transition = async () => {
      const prev = history.pop()!
      entries = prev
      changes = history.length > 0
      await tick()
    }
    if('startViewTransition' in document) {
      document.startViewTransition(transition)
    } else {
      transition()
    }
  }
  context.register(undo)

  function keyboard() {
    shortcuts?.showModal()
  }
  context.register(keyboard)

  async function showAll() {
    context.single = false
    const funcs = context.retrieveAll('toggleOpen')
    for(const toggleOpen of funcs) {
      toggleOpen({ open: true })
    }
  }
  context.register(showAll)

  async function hideAll() {
    const funcs = context.retrieveAll('toggleOpen')
    for(const toggleOpen of funcs) {
      toggleOpen({ open: false })
    }
  }
  context.register(hideAll)

  function add() {
    addFiles?.click()
  }
  context.register(add)

  function download() {
    const idLess = entries.map(({ id, ...rest }) => rest)
    const out = JSON5.stringify(idLess, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([out], { type: 'application/json' })
    )
    a.download = `mïmis config.${new Date().toISOString()}.json5`
    if(debug) console.debug({ Downloading: entries, href: a.href, name: a.download })
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    }, 100)
  }
  context.register(download)

  function focusSibling(element: HTMLElement, direction: 'up' | 'down') {
    const item = element.closest('li')
    const sib = (
      direction === 'up' ? (
        item?.previousElementSibling
      ) : (
        item?.nextElementSibling
      ) as HTMLLIElement
    )
    if(!sib) return
    const sibSum = sib.querySelector('summary')
    sibSum?.focus()
    context.retrieve('toggleOpen', { useActive: true })({ open: true })
  }
</script>

<svelte:head>
  <title>Mïmis: Merge List</title>
  <link rel="icon" href={`${assets}/merge%20left.svg`}/>
  <meta
    name="description"
    content={
      'Ordered list of files to be combined with others'
      + ' in the same namespace.'
    }
  />
</svelte:head>

<svelte:document
  on:datum-delete={(evt: CustomEvent) => {
    const { id } = evt.detail
    history.push([...entries])
    entries = entries.filter((entry) => entry.id !== id)
  }}
  onkeydown={(evt) => {
    if(
      context.any('isEditing')
      || document.activeElement instanceof HTMLInputElement
    ) {
      return
    }

    if(debug) console.debug({ 'document:onkeypress': {
      '🗝️': evt.key,
      isOpen: context.retrieve('isOpen', { useActive: true })?.(),
    } })

    if(evt.key === 'a') {
      addFiles?.click()
    } else if(evt.key === '?') {
      keyboard()
    } else if(evt.key === 's') {
      save()
    } else if(evt.key === 'u') {
      undo()
    } else if(evt.key === 'v') {
      showAll()
    } else if(evt.key === 'h') {
      hideAll()
    } else if(evt.key === 'd') {
      download()
    } else if(evt.key === 'l') {
      loadFiles?.click()
    } else if(evt.key === 'e') {
      evt.stopPropagation()
      context.retrieve('setEditing', { useActive: true })(true)
    } else if(evt.key === 'z') {
      context.retrieve('zoom', { useActive: true })()
    } else if(evt.key === 'Delete') {
      context.retrieve('remove', { useActive: true })()
    } else if(evt.key === 'Escape') {
      context.retrieve('toggleOpen', { useActive: true })({ open: false })
    } else if(evt.key === 'Enter') {
      context.retrieve('toggleOpen', { useActive: true })()
    } else if(evt.key === ' ') {
      evt.preventDefault()
      if(context.retrieve('isOpen', { useActive: true })()) {
        try {
          context.retrieve('togglePlay', { useActive: true })()
        } catch(err) {
          context.retrieve('toggleOpen', { useActive: true })()
        }
      } else {
        context.retrieve('toggleOpen', { useActive: true })()
      }
    } else if(/^Arrow(Up|Down)$/.test(evt.key)) {
      focusSibling(
        evt.target as HTMLElement,
        evt.key.replace(/^Arrow/, '').toLowerCase() as 'up' | 'down',
      )
    }
  }}
/>

<header>
  <h1>Merge List</h1>

  <nav>
    <ul id="controls">
      <li>
        <button
          id="save"
          type="button"
          onclick={save}
          disabled={!hasPath || !changes || saving}
          class:saving
        ><span>🖫</span></button>
        <dialog open>Save</dialog>
      </li>
      <li>
        <button
          id="load"
          type="button"
          onclick={load}
          disabled={!hasPath || saving}
        ><span>📥</span></button>
        <dialog open>Load</dialog>
      </li>
      <li>
        <form>
          <label>
            <button
              id="export"
              type="button"
              onclick={(evt) => loadFiles?.click()}
              disabled={loading}
            ><span>⭱</span></button>
            <input
              bind:this={loadFiles}
              type="file"
              accept="*json5,*.json"
              multiple
              onchange={(evt) => handleFiles(evt, loadConfigs)}
            />
          </label>
        </form>
        <dialog open>Import</dialog>
      </li>
      <li>
        <button
          id="import"
          type="button"
          onclick={download}
        ><span>⭳</span></button>
        <dialog open>Export</dialog>
      </li>
      <li>
        <button
          id="undo"
          type="button"
          onclick={undo}
          disabled={history.length === 0 || saving}
        ><span>↺</span></button>
        <dialog open>Undo</dialog>
      </li>
      <li>
        <button
          id="shortcuts"
          type="button"
          onclick={keyboard}
          class="pulsing"
        ><span>⌨</span></button>
        <dialog open>Shortcuts</dialog>
      </li>
      <li>
        <button
          id="show"
          type="button"
          onclick={showAll}
          disabled={entries.length === 0 || context.any('isOpen')}
        ><span>⟱</span></button>
        <dialog open>Show All</dialog>
      </li>
      <li>
        <button
          id="hide"
          type="button"
          onclick={hideAll}
          disabled={entries.length === 0 || !context.any('isOpen')}
        ><span>⟰</span></button>
        <dialog open>Hide All</dialog>
      </li>
      <li>
        <label class="button" id="single">
          <input
            type="checkbox"
            bind:checked={context.single}
            style:display="none"
          />
          <span>Ⅰ</span>
        </label>
        <dialog open>Single<br/>Visible</dialog>
      </li>
    </ul>
  </nav>
</header>

<main>
  <Path bind:elements={path}/>

  <form>
    <label>
      <button
        id="add-file"
        type="button"
        onclick={(evt) => addFiles?.click()}
        disabled={loading}
      >
        {#if loading}
          <span><section>
            <p>Loading…</p>
            <progress max={total} value={progress}>
              {progress / total * 100}%
            </progress>
          </section></span>
        {:else}
          <span>Add Files</span>
        {/if}
      </button>
      <input
        bind:this={addFiles}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        onchange={(evt) => handleFiles(evt, addEntries)}
      />
    </label>
  </form>

  {#if entries.length === 0}
    <p>No entries yet.</p>
  {:else}
    <SortableList bind:data={entries} bind:history/>
  {/if}

  <Shortcuts bind:handle={shortcuts}/>
</main>

<style>
  :root {
    interpolate-size: allow-keywords;
    --bg: var(--color, currentColor);
  }
  header {
    padding-top: 2rem;
  }
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
  }
  button, .button, label {
    z-index: 10;
    min-width: min-content;
  }
  button#add-file {
    position: sticky;
    top: 3rem;
  }
  button#save.saving span, button#save:hover span {
    display: block;
    transform-origin: 50% 40%;
    animation: spin 1s linear infinite forwards;
  }
  @keyframes spin {
    to { rotate: 360deg }
  }
  label.button:has(input) {
    --bg: red;
  }
  label.button:has(input:checked) {
    --bg: green;
  }
  ul#controls {
    position: fixed;
    list-style: none;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    top: 1.5rem;
    right: 1.5rem;

    & li {
      position: relative;
    }

    & li dialog {
      opacity: 0;
      transition: opacity 0.25s ease-in-out;
      padding: 0.25rem;
      margin: 1rem 0;
      border: none;
      pointer-events: none;
      white-space: pre;
      text-align: center;
    }

    & li:hover dialog {
      opacity: 1;
    }

    & :is(#shortcuts, #show, #hide, #single) + dialog {
      margin-inline-start: -1rem;
    }
  }

  input[type=file] {
    display: none;
  }

  :global(.sortable-list) {
    counter-reset: entry;
    list-style: none;
    margin-block: 2rem;
    margin-inline: auto;
    box-sizing: border-box;
    width: min(100%, 420px);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 2px solid var(--bg);
    border-radius: 0.5rem;
    padding: 0.5rem;

    & :global(li) {
      position: relative;
      border: 2px solid var(--bg);
      border-radius: 0.5rem;
      padding: 0.5rem;

      &:hover {
        background-color: color-mix(in oklab, var(--bg), transparent);
      }

      &                 { --bg: cyan }
      &:nth-of-type(1)  { --bg: color-mix(in oklab, red, #FFF 25%) }
      &:nth-of-type(2)  { --bg: color-mix(in oklab, red, #FFF 15%) }
      &:nth-of-type(3)  { --bg: color-mix(in oklab, red, #FFF 5%) }
      &:nth-of-type(4)  { --bg: color-mix(in oklab, red, #FFF 0%) }
      &:nth-of-type(5)  { --bg: color-mix(in oklab, red, #000 10%) }
      &:nth-of-type(6)  { --bg: color-mix(in oklab, red, #000 20%) }
      &:nth-of-type(7)  { --bg: color-mix(in oklab, red, #000 30%) }
      &:nth-of-type(8)  { --bg: color-mix(in oklab, red, #000 40%) }
      &:nth-of-type(9)  { --bg: color-mix(in oklab, red, #000 60%) }
      &:nth-of-type(10) { --bg: color-mix(in oklab, red, #000 75%) }
      &:nth-of-type(11) { --bg: color-mix(in oklab, orange, #FFF 25%) }
      &:nth-of-type(12) { --bg: color-mix(in oklab, orange, #FFF 15%) }
      &:nth-of-type(13) { --bg: color-mix(in oklab, orange, #FFF 5%) }
      &:nth-of-type(14) { --bg: color-mix(in oklab, orange, #FFF 0%) }
      &:nth-of-type(15) { --bg: color-mix(in oklab, orange, #000 10%) }
      &:nth-of-type(16) { --bg: color-mix(in oklab, orange, #000 20%) }
      &:nth-of-type(17) { --bg: color-mix(in oklab, orange, #000 30%) }
      &:nth-of-type(18) { --bg: color-mix(in oklab, orange, #000 40%) }
      &:nth-of-type(19) { --bg: color-mix(in oklab, orange, #000 60%) }
      &:nth-of-type(20) { --bg: color-mix(in oklab, orange, #000 75%) }
      &:nth-of-type(21) { --bg: color-mix(in oklab, yellow, #FFF 25%) }
      &:nth-of-type(22) { --bg: color-mix(in oklab, yellow, #FFF 15%) }
      &:nth-of-type(23) { --bg: color-mix(in oklab, yellow, #FFF 5%) }
      &:nth-of-type(24) { --bg: color-mix(in oklab, yellow, #FFF 0%) }
      &:nth-of-type(25) { --bg: color-mix(in oklab, yellow, #000 10%) }
      &:nth-of-type(26) { --bg: color-mix(in oklab, yellow, #000 20%) }
      &:nth-of-type(27) { --bg: color-mix(in oklab, yellow, #000 30%) }
      &:nth-of-type(28) { --bg: color-mix(in oklab, yellow, #000 40%) }
      &:nth-of-type(29) { --bg: color-mix(in oklab, yellow, #000 60%) }
      &:nth-of-type(30) { --bg: color-mix(in oklab, yellow, #000 75%) }
      &:nth-of-type(31) { --bg: color-mix(in oklab, green, #FFF 25%) }
      &:nth-of-type(32) { --bg: color-mix(in oklab, green, #FFF 15%) }
      &:nth-of-type(33) { --bg: color-mix(in oklab, green, #FFF 5%) }
      &:nth-of-type(34) { --bg: color-mix(in oklab, green, #FFF 0%) }
      &:nth-of-type(35) { --bg: color-mix(in oklab, green, #000 10%) }
      &:nth-of-type(36) { --bg: color-mix(in oklab, green, #000 20%) }
      &:nth-of-type(37) { --bg: color-mix(in oklab, green, #000 30%) }
      &:nth-of-type(38) { --bg: color-mix(in oklab, green, #000 40%) }
      &:nth-of-type(39) { --bg: color-mix(in oklab, green, #000 60%) }
      &:nth-of-type(40) { --bg: color-mix(in oklab, green, #000 75%) }
      &:nth-of-type(41) { --bg: color-mix(in oklab, cyan, #FFF 25%) }
      &:nth-of-type(42) { --bg: color-mix(in oklab, cyan, #FFF 15%) }
      &:nth-of-type(43) { --bg: color-mix(in oklab, cyan, #FFF 5%) }
      &:nth-of-type(44) { --bg: color-mix(in oklab, cyan, #FFF 0%) }
      &:nth-of-type(45) { --bg: color-mix(in oklab, cyan, #000 10%) }
      &:nth-of-type(46) { --bg: color-mix(in oklab, cyan, #000 20%) }
      &:nth-of-type(47) { --bg: color-mix(in oklab, cyan, #000 30%) }
      &:nth-of-type(48) { --bg: color-mix(in oklab, cyan, #000 40%) }
      &:nth-of-type(49) { --bg: color-mix(in oklab, cyan, #000 60%) }
      &:nth-of-type(50) { --bg: color-mix(in oklab, cyan, #000 75%) }
      &:nth-of-type(51) { --bg: color-mix(in oklab, blue, #FFF 25%) }
      &:nth-of-type(52) { --bg: color-mix(in oklab, blue, #FFF 15%) }
      &:nth-of-type(53) { --bg: color-mix(in oklab, blue, #FFF 5%) }
      &:nth-of-type(54) { --bg: color-mix(in oklab, blue, #FFF 0%) }
      &:nth-of-type(55) { --bg: color-mix(in oklab, blue, #000 10%) }
      &:nth-of-type(56) { --bg: color-mix(in oklab, blue, #000 20%) }
      &:nth-of-type(57) { --bg: color-mix(in oklab, blue, #000 30%) }
      &:nth-of-type(58) { --bg: color-mix(in oklab, blue, #000 40%) }
      &:nth-of-type(59) { --bg: color-mix(in oklab, blue, #000 60%) }
      &:nth-of-type(60) { --bg: color-mix(in oklab, blue, #000 75%) }
      &:nth-of-type(61) { --bg: color-mix(in oklab, indigo, #FFF 25%) }
      &:nth-of-type(62) { --bg: color-mix(in oklab, indigo, #FFF 15%) }
      &:nth-of-type(63) { --bg: color-mix(in oklab, indigo, #FFF 5%) }
      &:nth-of-type(64) { --bg: color-mix(in oklab, indigo, #FFF 0%) }
      &:nth-of-type(65) { --bg: color-mix(in oklab, indigo, #000 10%) }
      &:nth-of-type(66) { --bg: color-mix(in oklab, indigo, #000 20%) }
      &:nth-of-type(67) { --bg: color-mix(in oklab, indigo, #000 30%) }
      &:nth-of-type(68) { --bg: color-mix(in oklab, indigo, #000 40%) }
      &:nth-of-type(69) { --bg: color-mix(in oklab, indigo, #000 60%) }
      &:nth-of-type(70) { --bg: color-mix(in oklab, indigo, #000 75%) }
      &:nth-of-type(71) { --bg: color-mix(in oklab, violet, #FFF 25%) }
      &:nth-of-type(72) { --bg: color-mix(in oklab, violet, #FFF 15%) }
      &:nth-of-type(73) { --bg: color-mix(in oklab, violet, #FFF 5%) }
      &:nth-of-type(74) { --bg: color-mix(in oklab, violet, #FFF 0%) }
      &:nth-of-type(75) { --bg: color-mix(in oklab, violet, #000 10%) }
      &:nth-of-type(76) { --bg: color-mix(in oklab, violet, #000 20%) }
      &:nth-of-type(77) { --bg: color-mix(in oklab, violet, #000 30%) }
      &:nth-of-type(78) { --bg: color-mix(in oklab, violet, #000 40%) }
      &:nth-of-type(79) { --bg: color-mix(in oklab, violet, #000 60%) }
      &:nth-of-type(80) { --bg: color-mix(in oklab, violet, #000 75%) }
      &:nth-of-type(10n + 1),
      &:nth-of-type(10n + 2),
      &:nth-of-type(10n + 3),
      &:nth-of-type(10n + 4),
      &:nth-of-type(10n + 5) {
        --fg: color-mix(in oklab, var(--bg), #000 75%);
      }
    }

    & :global(li:focus-within), & :global(li:focus) {
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

  .pulsing {
    animation: pulse alternate 2.5s infinite linear;
  }

  @keyframes pulse {
    to {
      background-color: yellow;
      color: black;
    }
  }
</style>
