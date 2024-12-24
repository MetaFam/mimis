<script lang="ts">
  import { Wunderbaum } from 'wunderbaum'
  import { wunderFiles } from '$lib/wunderFiles'
  import { selectAll } from '$lib/selectAll'
  import { car2Tree } from '$lib/car2Tree';
  import { wunder2Neo4j } from '$lib/wunder2Neo4j';
  import 'bootstrap-icons/font/bootstrap-icons.css'
  import 'wunderbaum/dist/wunderbaum.css'

  class CAR {
    form = $state<HTMLFormElement>()
    disabled = $state<boolean>(!this.form?.checkValidity())
  }

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
  }

  const submitMount = async (evt: SubmitEvent) => {
    evt.preventDefault()
    const mount = path.split('/').filter(Boolean)
    if(!tree) throw new Error('No tree to mount.')
    const cid = wunder2Neo4j(tree.root, mount)
  }
  </script>

<svelte:head>
  <title>Upload a CAR</title>
</svelte:head>

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
    <button>Neo4j Import</button>
  </form>
{/if}

<div id="fs-tree"></div>

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
  }
</style>