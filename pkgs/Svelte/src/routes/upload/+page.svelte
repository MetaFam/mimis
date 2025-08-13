<script lang="ts">
  import Toastify from 'toastify-js'
  import { Wunderbaum } from 'wunderbaum'
  import { wunderFiles } from '$lib/wunderFiles'
  import { selectAll } from '$lib/selectAll'
  import { car2Tree } from '$lib/car2Wunder';
  import { wunder2Neo4j } from '$lib/wunder2Neo4j';
  import { createStoracha } from '$lib/ipfs'
  import { logger } from '$lib'
	import 'bootstrap-icons/font/bootstrap-icons.min.css'
  import 'wunderbaum/dist/wunderbaum.css'
  import 'toastify-js/src/toastify.css'

  class CAR {
    form = $state<HTMLFormElement>()
    disabled = $derived(!this.form?.checkValidity())
    generating = $state(false)
  }

  let count = $state(0)
  let tree = $state<Wunderbaum>()
  let car = new CAR()
  let path = $state('')
  let file = $state<File | null | undefined>(null)
  const carLogs = $state(<Array<string>>([]))

  const carLog = logger(carLogs)

  const submitCAR = async (evt: SubmitEvent) => {
    evt.preventDefault()
    const input: HTMLInputElement | null = (
      car.form?.querySelector('input[type="file"]') ?? null
    )
    file = input?.files?.[0]
    if(!file) {
      throw new Error('No file selected.')
    }
    const source = await car2Tree(file, { log: console.debug })
    selectAll(source)
    tree = wunderFiles({
      source,
      mount: 'fs-tree',
    })
    // ToDo: Expand small trees. This code doesn't work.
    // if(source.flat(3).length < 25) {
    //   tree.expandAll()
    // }
  }

  const submitMount = async (evt: SubmitEvent) => {
    evt.preventDefault()
    try {
      car.generating = true
      const mount = path.split('/').filter(Boolean)
      if(!tree) throw new Error('No tree to mount.')
      const log = (msg: string | {}) => {
        console.debug(msg)
        count++
      }
      console.debug({ root: tree.root })
      const cid: string = await wunder2Neo4j(
        tree.root, mount, log,
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

  async function uploadCAR(evt: SubmitEvent) {
    evt.preventDefault()
    if(!file) {
      throw new Error('CAR upload attempted with no file.')
    }
    const storacha = await createStoracha({ log: carLog })
    carLog?.(`Uploading: ${file.name}.`)
    await storacha.uploadCAR(file)
  }
  </script>

<svelte:head>
  <title>Upload a CAR</title>
  <link rel="icon" href="upload.svg"/>
</svelte:head>

<header>
  <h1>Upload a CAR File to Mïmis</h1>
</header>

  <main>
  <form bind:this={car.form} onsubmit={submitCAR}>
    <input
      type="file" required accept=".car"
      onchange={() => car.disabled = !car.form?.checkValidity()}
    />
    <button disabled={car.disabled}><span>Read CAR</span></button>
  </form>
  {#if !!tree}
    <form onsubmit={submitMount}>
      <input placeholder="/system/mount/point/" bind:value={path}/>
      <button disabled={car.generating}><span>
        Neo4j Import
        {#if car.generating}
          {count.toLocaleString()}
        {/if}
      </span></button>
    </form>
  {/if}
  <div id="fs-tree"></div>
  {#if !!file}
    <form onsubmit={uploadCAR}>
      <button disabled={!file}><span>
        Upload Entire CAR
      </span></button>
      <ul>
        <li><label>
          <input type="checkbox" name="service" value="storacha" checked/>
          to Storacha
        </label></li>
        <li><label>
          <input type="checkbox" name="service" value="kubo"/>
          to Kubo
        </label></li>
      </ul>
    </form>
    <ol reversed>
      {#each carLogs as log}
        <li>{log}</li>
      {/each}
    </ol>
  {/if}
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