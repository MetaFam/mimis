<script lang="ts">
  import { searchTree } from '$lib/searchTree'

  let chips = $state<Array<string>>([])
  let resultPromise = $derived.by(async () => {
    const result = await searchTree(chips)
    console.debug({ result })
    return result
  })
  let fileCID = $state<string | null>(null)

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
      fileCID = null
    }
  }
  const removeChip = (index: number) => {
    chips.splice(index, 1)
  }
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
          <button onclick={() => removeChip(index)}>⨯</button>
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
              <button onclick={() => {
                if(res.get('child').labels.includes('File')) {
                  fileCID = res.get('child').properties.cid
                  console.debug({ fileCID })
                } else {
                  addChip(res.get('path'))
                }
              }}>
                {res.get('path')}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/await}
    {#if fileCID}
      <object
        data={`ipfs://${fileCID}`}
        title={`ipfs://${fileCID}`}
      >
        <p>
          Could not display
          <a
            target="_blank"
            href={`https://w3s.link/ipfs/${fileCID}`}
          >
            ipfs://{fileCID}
          </a>.
        </p>
      </object>
    {/if}
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

      button {
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
</style>
