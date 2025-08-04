<script lang="ts">
  import { Wunderbaum } from 'wunderbaum'
  import { wunderFiles } from '$lib/wunderFiles'
  import { selectAll } from '$lib/selectAll'
  import { car2Tree } from '$lib/car2Wunder';
  import { wunder2Neo4j } from '$lib/wunder2Neo4j';
  import Toastify from 'toastify-js'
	import 'bootstrap-icons/font/bootstrap-icons.min.css'
  import 'wunderbaum/dist/wunderbaum.css'
  import 'toastify-js/src/toastify.css'

  class CAR {
    form = $state<HTMLFormElement>()
    disabled = $state<boolean>(!this.form?.checkValidity())
    generating = $state<boolean>(false)
  }

  let count = $state<number>(0)
  let tree = $state<Wunderbaum>()
  let car = new CAR()
  let path = $state('')

  const submitCAR = async (evt: SubmitEvent) => {
    evt.preventDefault()
    const input: HTMLInputElement | null = (
      car.form?.querySelector('input[type="file"]') ?? null
    )
    const file = input?.files?.[0]
    if(!file) {
      throw new Error('No file selected.')
    }
    const source = await car2Tree(file)
    selectAll(source)
    tree = wunderFiles({
      source,
      mount: 'fs-tree',
    })
    tree.expandAll()
  }

  const submitMount = async (evt: SubmitEvent) => {
    evt.preventDefault()
    try {
      car.generating = true
      const mount = path.split('/').filter(Boolean)
      if(!tree) throw new Error('No tree to mount.')
      const onAdd = (msg: string | {}) => {
        console.debug(msg)
        count++
      }
      console.debug({ root: tree.root })
      const cid: string = await wunder2Neo4j(
        tree.root, mount, onAdd,
      )
      Toastify({
        text: `Loaded: id://${cid.slice(0, 5)}…${cid.slice(-5)}`,
        duration: 8_000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
      }).showToast()
    } finally {
      car.generating = false
    }
  }
  </script>

<svelte:head>
  <title>Upload a CAR</title>
  <link rel="icon" href="upload.svg"/>
</svelte:head>

<header>
  <h1>Upload a CAR File to Mïmis
</header>

<main>
  <form bind:this={car.form} onsubmit={submitCAR}>
    <input
      type="file" required accept=".car"
      onchange={() => car.disabled = !car.form?.checkValidity()}
    />
    <button disabled={car.disabled}>Read CAR</button>
  </form>
  {#if !!tree}
    <form onsubmit={submitMount}>
      <input placeholder="/system/mount/point/" bind:value={path}/>
      <button disabled={car.generating}>
        Neo4j Import
        {#if car.generating}
          {count.toLocaleString()}
        {/if}
      </button>
    </form>
  {/if}

  <div id="fs-tree"></div>
</main>

<style>
  form {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 15vh;
  }

  #fs-tree {
    margin-inline: auto;
    resize: both;
    display: inline-block;
  }
</style>