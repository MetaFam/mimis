<script lang="ts">
    import { toHTTP } from '$lib/toHTTP';
  import {
    verifiedFetch as ipfsFetch,
  } from '@helia/verified-fetch'
  import * as cbor from '@ipld/dag-cbor'


  async function submitOps(evt: SubmitEvent) {
    evt.preventDefault()
    const ops = []
    let { value: cid } = (evt.currentTarget as HTMLFormElement).opsCID
    while(cid != null) {
      // const response = await ipfsFetch(`ipfs://${cid}`)
      console.debug({ Retrieving: cid })
      const response = await fetch(`${toHTTP({ cid })}?format=raw`)
      const op = cbor.decode(await response.bytes())
      ops.unshift(op)
      cid = op.previous?.toString()
    }
    console.debug({ ops })
  }

  function submitGraph(evt: SubmitEvent) {
    evt.preventDefault()
  }
</script>

<svelte:head>
  <title>Load</title>
</svelte:head>

<header>
  <h1>Load Operations Or Graph State</h1>
</header>

<main>
  <form onsubmit={submitOps}>
    <input id="opsCID" required/>
    <button>Load Operations</button>
  </form>
  <hr/>
  <form onsubmit={submitGraph}>
    <input type="file" id="graphs" required/>
    <button>Load Graph</button>
  </form>
</main>

<style>
  main, form {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  hr {
    width: 75%;
  }
</style>