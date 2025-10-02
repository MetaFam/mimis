<script lang="ts">
  import Toastify from 'toastify-js'
  import { Wunderbaum } from 'wunderbaum'
  import type { WunderbaumNode } from 'wb_node'
  import { wunderFiles } from '$lib/wunderFiles'
  import { selectAll } from '$lib/selectAll'
  import { car2Tree } from '$lib/car2Wunder'
  import { wunder2Neo4j } from '$lib/wunder2Neo4j'
  import { toHTTP } from '$lib/toHTTP'
  import { createStoracha } from '$lib/ipfs'
  import type { CARInfo } from '$lib/cypher'
  import settings from '$lib/settings.svelte'
  import { logger, timestamp } from '$lib'
  import Display from '../Display.svelte'
  import Path from '../list/[...path]/Path.svelte'
	import 'bootstrap-icons/font/bootstrap-icons.min.css'
  import 'wunderbaum/dist/wunderbaum.css'
  import 'toastify-js/src/toastify.css'

  class CAR {
    form = $state<HTMLFormElement>()
    disabled = $derived(!this.form?.checkValidity())
    generating = $state(false)
  }
  class Content {
    url = $state<string>()
    title = $state<string>()

    remove() {
      this.url = this.title = undefined
    }

    get present() {
      return !!this.url
    }
  }

  let count = $state(0)
  let tree = $state<Wunderbaum>()
  let car = new CAR()
  let path = $state([''])
  let file = $state<File | null | undefined>(null)
  let opsCAR = $state<CARInfo | null>(null)
  const carLogs = $state(<Array<string>>([]))
  let content = new Content()

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
      activate: async (evt) => {
        console.debug({ count: evt.node.children?.length, bool: (evt.node.children?.length ?? 1) > 0 })
        if(evt.node.children && evt.node.children.length > 0) {
          content.remove()
        } else {
          content.title = evt.node.title
          content.url = toHTTP({ cid: await evt.node.data.cid })
          console.debug({ title: content.title, url: content.url })
        }
      },
    })
    tree.data.filename = file.name
    // ToDo: Expand small trees. This code doesn't work.
    // if(source.flat(3).length < 25) {
    //   tree.expandAll()
    // }
  }
  $inspect(content)

  const on = { node: { enter: (_node: WunderbaumNode) => {
    count++
  } } }

  const submitMount = async (evt: SubmitEvent) => {
    evt.preventDefault()
    try {
      car.generating = true
      const mount = [...path].filter(Boolean)
      if(!tree) throw new Error('No tree to mount.')
      const log = (msg: string | {}) => {
        console.debug(msg)
      }
      await wunder2Neo4j({
        root: tree.root, path: mount, log, on,
      })
      Toastify({
        text: `Loaded: ${count} Entr${count === 1 ? 'y' : 'ies'}`,
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
    carLog?.(`Finished Uploading.`)
  }

  async function uploadOps(evt: SubmitEvent) {
    evt.preventDefault()
    if(!file) {
      throw new Error('CAR upload attempted with no file.')
    }
    const storacha = await createStoracha({ log: carLog })
    carLog?.(`Uploading: ${file.name}.`)
    await storacha.uploadCAR(file)
    carLog?.(`Finished Uploading.`)
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
  <form id="read-car" bind:this={car.form} onsubmit={submitCAR}>
    <input
      type="file" required accept=".car"
      onchange={() => car.disabled = !car.form?.checkValidity()}
    />
    {#if !car.disabled}
      <button disabled={car.disabled}><span>
        Read CAR
      </span></button>
    {/if}
  </form>
  {#if !!tree}
    <form id="neo4j-import" onsubmit={submitMount}>
      <Path bind:elements={path}/>
      <button disabled={car.generating}><span>
        Neo4j Import
        {#if car.generating}
          {count.toLocaleString()}
        {/if}
      </span></button>
    </form>
  {/if}
  {#if !!opsCAR}
    {@const carBrowseURL = toHTTP({ url: `ipfs://${opsCAR.cid}` })}
    <section id="ops">
      <a
        class="button"
        href={opsCAR.url}
        download={opsCAR.filename}
      ><span>
        Download <code>{opsCAR.filename}</code>
      </span></a>
      <form onsubmit={uploadOps}>
        <button disabled={!file}><span>
          Upload Operations
        </span></button>
        <ul>
          <li><label>
            <input
              type="checkbox"
              name="service"
              value="storacha"
              checked={!!settings.storachaEmail && !!settings.storachaSpace}
            />
            to Storacha
          </label></li>
          <li><label>
            <input type="checkbox" name="service" value="kubo" checked={!!settings.ipfsAPI}/>
            to Kubo
          </label></li>
        </ul>
      </form>
    </section>
    <section id="browse">
      <a
        class="button"
        href={carBrowseURL}
        target="_blank"
      ><span>
        Browse {carBrowseURL}
      </span></a>
    </section>
  {/if}
  <section id="display">
		<div id="fs-tree" class:accompanied={content.present}></div>
		<div id="content">
			{#if content.present}
				<Display {...content}/>
			{/if}
		</div>
	</section>
  {#if !!file}
    <form id="input-upload" onsubmit={uploadCAR}>
      <button disabled={!file}><span>
        Upload Entire Input CAR
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
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  form {
    display: flex;
    justify-content: center;
    gap: 1rem;
    & input {
      font-size: 15pt;
    }
  }
  #input-upload {
    margin-top: 15vh;
  }
  #neo4j-import, #browse, #ops {
    margin-block-start: 5vh;
  }
  #ops {
    display: flex;
    gap: 3vw;
  }

  #fs-tree {
    margin-inline: auto;
    resize: both;
    display: inline-block;
    margin-block-start: 1rem;
  }

  #display {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 100%;

    & > * {
      width: 100%;
      height: 100%;
      max-width: 100%;
    }
  }
</style>