<script lang="ts" >
  import Toastify from 'toastify-js'
  import { onMount } from 'svelte'
  import { isRedirect, redirect } from '@sveltejs/kit'
  import mime from 'mime'
  import { page } from '$app/state'
  import { goto, onNavigate } from '$app/navigation'
  import { searchTree } from '$lib/searchTree'
  import { toHTTP } from '$lib/toHTTP'
  import { settings } from '$lib/settings.svelte'
  import 'toastify-js/src/toastify.css'

  const limit = ((limit) => (
    limit ? Number(limit) : settings.limit
  ))(page.url.searchParams.get('limit'))
  const offset = Number(page.url.searchParams.get('offset'))

  class DirSelection {
    public selected: string
    public previous: DirSelection | null
    #choices: Array<string> | null

    constructor({
      selected,
      choices = null,
      previous = null,
    }: {
      selected?: string
      choices?: Array<string> | null
      previous?: DirSelection | null
    } = {}) {
      if(!selected) throw new Error('`selected` is not defined.')
      if(choices != null && !choices.includes(selected)) {
        throw new Error('`choices` doesn’t contain `selected`.`')
      }
      this.selected = $state(selected)
      this.previous = previous
      this.#choices = $state(choices)
    }

    get path(): Array<string> {
      return (
        [...(this.previous?.path ?? []), this.selected]
        .filter(Boolean)
      )
    }

    async choices() {
      if(this.#choices == null) {
        const path = this.path.slice(0, -1)
        const result = await searchTree({ path, limit, offset })
        const options = result.map(
          (rec) => rec.get('next').properties.path
        ).filter(Boolean)
        if(options.length > 1) options.unshift('*')
        this.#choices = options
      }
      return this.#choices
    }
  }

  function mkDirs(path: Array<string>) {
    path = path.filter(Boolean)
    let previous = null
    const dirs = []
    for(const elem of path) {
      dirs.push(
        new DirSelection({ selected: elem, previous })
      )
      previous = dirs.at(-1)
    }
    return dirs
  }

  const { data } = $props()
  if(settings.debugging) console.debug({ 'Page Data': data })

  let dirsList = $state<Array<DirSelection>>(
    mkDirs(page.params.path?.split('/') ?? [])
  )
  let chips = $derived(dirsList.map((dir) => dir.selected))
  let basePath = $state<Array<string>>([])
  let resultPromise = $derived.by(async () => {
    try {
      const path = [...chips]
      let type = null
      if(chips.length > 0 && !page.params.path?.endsWith('/')) {
        ([, type] =  Array.from(
          path.at(-1)?.match(/^(.+)\.\1$/) ?? []
        ))
        if(!!type) path.pop()
      }
      const result = await searchTree({
        path,
        type,
        limit,
        offset,
      })
      if(!!type) {
        const file = result.find((ret) => (
          ret.get('child')?.labels.includes('File')
        ))
        const { cid } = file?.get('child')?.properties
        if(!!cid) {
          console.debug({ Redirecting: cid })
          // ToDo: Redirect needs to happen on the server to
          //       allow loading resources like HTML and JavaScript
          // throw redirect(303, toHTTP({ cid })) // server only
          window.location.href = toHTTP({ cid })
        }
      }
      return result
    } catch(error) {
      if(isRedirect(error)) throw redirect
      Toastify({
        text: (error as Error).message,
        duration: 16_000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
      }).showToast()
    }
  })

  let baseLength = 1
  onMount(async () => {
    const path = (
      page.url.pathname.split('/').filter(Boolean)
    )
    baseLength = path.length - dirsList.length
    basePath = path.slice(0, baseLength)
  })

  onNavigate(async (nav) => {
    dirsList = mkDirs(
      nav.to?.params?.path?.split('/') ?? []
    )
  })

  type ChipForm = HTMLFormElement & {
    elements: { chip: HTMLInputElement }
  }

  const submitChip = (evt: SubmitEvent) => {
    evt.preventDefault()
    const input = (evt.target as ChipForm).elements.chip
    addChip(input.value)
    input.value = ''
  }
  const addChip = (chip: string) => {
    chip = chip.trim()
    if(!!chip) {
      dirsList.push(new DirSelection({ selected: chip }))
    }
  }
  const removeDirs = (index: number) => {
    dirsList.splice(index, 1)
  }

  $effect(() => {
    const keydown = (evt: KeyboardEvent) => {
      if(
        evt.key === 'ArrowLeft'
        && evt.target === document.body
      ) {
        removeDirs(-1)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      window.removeEventListener('keydown', keydown)
    }
  })
</script>

<svelte:head>
  <title>Mïmis: Search</title>
  <link rel="icon" href="infinity%20eyes.svg"/>
</svelte:head>

<main>
  {#if dirsList.length > 0}
    <ul id="path">
      {#each dirsList as option, idx}
        <li>
          {#await option.choices()}
            <span>Loading…</span>
          {:then choices}
            {#if choices.length > 1}
              <!-- @ts-ignore -->
              <select oninput={({ target }) => {
                option.selected = (
                  (target as HTMLSelectElement).value
                )
                dirsList = dirsList.slice(0, idx + 1)
                goto(`/${
                  [...basePath, ...chips]
                  .map(encodeURIComponent)
                  .join('/')
                }`)
              }}>
                {#each choices as opt}
                  <option selected={opt === option.selected}>
                    {opt}
                  </option>
                {/each}
              </select>
            {:else}
              <button onclick={(evt) => {
                dirsList = dirsList.slice(0, idx + 1)
                goto(`/${
                  [...basePath, ...chips]
                  .map(encodeURIComponent)
                  .join('/')
                }`)
              }}>
                <span>{option.selected}</span>
              </button>
            {/if}
          {/await}
        </li>
      {/each}
    </ul>
  {/if}

  <section id="result">
    {#await resultPromise}
      <h2>Searching…</h2>
    {:then result}
      {#if !result || result.length === 0}
        <h2>No Results</h2>
      {:else}
        <ul id="result">
          {#each result as res}
            {@const path = (
              '/' + (
                [...basePath, ...chips]
                .map(encodeURIComponent)
                .join('/')
              )
            )}
            <li>
              {#if res.get('child')?.labels.includes('File')}
                {@const { cid, mimetype } = res.get('child')?.properties}
                {@const ext = mime.getExtension(mimetype)}
                <h2>
                  <a href="{path}/{ext}.{ext}"><code>
                    /{res.get('path')?.join('/')} <em>({mimetype})</em>
                  </code></a>
                </h2>
                <object
                  data={toHTTP({ cid })}
                  title={`ipfs://${cid}`}
                >
                  <p>
                    Could not display
                    <a target="_blank" href={toHTTP({ cid })}>
                      ipfs://{cid}
                    </a>.
                  </p>
                </object>
              {:else}
                {@const { path: chip } = res.get('next').properties}
                <a
                  class="button"
                  href="{path}/{encodeURIComponent(chip)}"
                >
                  <span>{chip}</span>
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/await}
    </section>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    margin-block-start: 3rem;
    gap: 1rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  ul {
    list-style: none;
  }
  input, li, select {
    font-size: 15pt;
  }
  #path {
    display: flex;
    gap: 0.5rem;

    li {
      position: relative;
      display: inline-block;

      .button {
        position: absolute;
        font-size: 1rem;
        min-width: 2.25rem;
        top: -1.5rem;
        right: -1.5rem;
      }
    }
  }
  #result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
  }
  object {
    display: block;
    min-height: 80dvh;
    max-width: 100dvw;
    margin-block: 1rem;
    margin-inline: auto;
  }
  h2 {
    text-align: center;
    font-weight: bolder;
    margin-block-start: 2rem;
  }
</style>
