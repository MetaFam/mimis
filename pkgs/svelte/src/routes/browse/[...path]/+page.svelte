<script lang="ts" >
  import Toastify from 'toastify-js'
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { searchTree } from '$lib/searchTree'
  import { toHTTP } from '$lib/toHTTP'
  import { settings } from '$lib/settings.svelte'
  import 'toastify-js/src/toastify.css'

  let chips = $state<Array<string>>([])
  let resultPromise = $derived.by(async () => {
    $inspect({ chips, basePath })
    try {
      const limit = page.url.searchParams.get('limit')
      const offset = page.url.searchParams.get('offset')
      const result = await searchTree({
        path: chips,
        limit: (
          limit ? Number(limit) : settings.limit
        ),
        offset: Number(offset),
      })
      return result
    } catch(error) {
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
  let basePath = $state('')

  onMount(() => {
    chips = (
      page.params.path.split('/').filter(Boolean)
    )
    const path = (
      page.url.hash.split('/').filter(Boolean)
    )
    basePath = (
      path.slice(0, path.length - chips.length).join('/')
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
      chips.push(chip)
    }
  }
  const removeChip = (index: number) => {
    chips.splice(index, 1)
  }
  const removeLastChip = () => {
    removeChip(-1)
  }

  $effect(() => {
    const keydown = (evt: KeyboardEvent) => {
      if(
        evt.key === 'ArrowLeft'
        && evt.target === document.body
      ) {
        removeLastChip()
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
</svelte:head>

<main>
  <form onsubmit={submitChip}>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="chip" placeholder="Path Element" autofocus/>
    <button>Add Path Element</button>
  </form>

  {#if chips.length > 0}
    <ul id="path">
      {#each chips as chip, index}
        <li>
          {chip}
          <a
            class="button"
            href={
              `${basePath}/${chips.toSpliced(index, 1).join('/')}`
            }
            onclick={() => removeChip(index)}
          >⨯</a>
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
            <li>
              {#if res.get('child').labels.includes('File')}
                <h2>/{res.get('path')?.join('/')}/{res.get('container')}</h2>
                <object
                  data={toHTTP({ cid: res.get('child').properties.cid })}
                  title={`ipfs://${res.get('child').properties.cid}`}
                >
                  <p>
                    Could not display
                    <a
                      target="_blank"
                      href={
                        `https://w3s.link/ipfs/${res.get('child').properties.cid}`
                      }
                    >
                      ipfs://{res.get('child').properties.cid}
                    </a>.
                  </p>
                </object>
              {:else}
                <a
                  class="button"
                  href={
                    `${basePath}/${chips.join('/')}${chips.length > 0 ? '/' : ''}${res.get('container')}`
                  }
                  onclick={() => { console.debug('H!'); addChip(res.get('container')) }}
                >
                  {res.get('container')}
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
  #path {
    display: flex;
    gap: 0.5rem;

    li {
      display: inline-block;
      padding: 0.25em 0.5em;
      border: 2px solid #9999;
      border-radius: 10%;

      .button {
        border-radius: 50%;
        padding: 0.25em;
        width: 2em;
      }
    }
  }
  #result {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  object {
    min-height: 80dvh;
    max-width: 100dvh;
    margin-block: 1rem;
  }
  h2 {
    text-align: center;
    font-weight: bolder;
    margin-block-start: 2rem;
  }
</style>
