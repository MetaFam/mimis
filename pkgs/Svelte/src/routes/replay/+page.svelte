<script lang="ts">
  import { Recorder } from '$lib/cypher'
  import { CID } from 'multiformats/cid'

  let cid = $state<string>()
  const valid = $derived.by(() => {
    if(!cid) return false
    let valid = false
    try {
      valid ||= !!CID.parse(cid)
    } catch(err) { valid = false }
    return valid
  })

  async function onsubmit(evt: SubmitEvent) {
    evt.preventDefault()
    if(cid != null && valid) {
      const ops = await Recorder.fromCID(cid)
      console.debug({ Loaded: ops.ops })
      await ops.run()
    }
  }
</script>

<svelte:head>
  <title>Mïmis: Replay</title>
</svelte:head>

<header>
  <h1>Run Operations from a CBOR-DAG Chain</h1>
</header>

<main>
  <form {onsubmit}>
    <input bind:value={cid}/>
    <button disabled={!valid}><span>
      Load Operations
    </span></button>
  </form>
</main>

<style>
  main, form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  main {
    margin-block-start: 10vh;
  }
  button {
    margin-block-start: 1.5rem;
  }
</style>