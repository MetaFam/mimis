<script lang="ts">
  import Toastify from 'toastify-js'
  import Path from '../list/[...path]/Path.svelte'
  import { create, equalize } from '$lib/cypher'
  import 'toastify-js/src/toastify.css'

  let to = $state([''])
  let froms = $state([['']])

  const equivocate = $derived(async () => {
    try {
      const dataful = (
        froms
        .map((from) => from.filter(Boolean))
        .filter((from) => from.length > 0)
      )
      if(dataful.length === 0) {
        throw new Error('No `from` paths specified.')
      }
      if(!to.every(Boolean)) {
        throw new Error('No `to` path specified.')
      }
      const nodeIds = await Promise.all(
        [...dataful, to].map(async (path) => (
          await create({ path })
        ))
      )
      console.debug({ dataful, to, nodeIds })
      await equalize(nodeIds)
    } catch(error) {
      Toastify({
        text: `Error: ${(error as Error).message}`,
        duration: 12_000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #b09b22, #969d)",
        },
      }).showToast()
    }
  })
</script>

<svelte:head>
  <title>Mïmis: Equivalancies</title>
</svelte:head>

<header>
  <h1>Create Equivalencies</h1>
</header>

<main>
  <button onclick={() => froms.push([''])}><span>
    Add From Path
  </span></button>
  <ol>
    {#each froms as _from, num}
      <li><label>
        From #{num + 1}: <Path bind:elements={froms[num]}/>
      </label></li>
    {/each}
  </ol>
  <label>
    To: <Path bind:elements={to}/>
  </label>
  <button onclick={equivocate}><span>
    Mark Equal
  </span></button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    & button {
      max-width: max-content;
    }

    & label {
      display: flex;
      align-items: center;
      font-size: 15pt;
    }
  }
</style>