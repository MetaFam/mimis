<script lang="ts">
  import { CID } from 'multiformats'
  import { getAccount } from '@wagmi/core'
  import Toastify from 'toastify-js'
  import { timestamp } from '$lib'
  import { neo4j2IPFS } from '$lib/neo4j2DAGJSON'
  import { toHTTP } from '$lib/toHTTP'
  import { Web3 } from '$lib/web3'
  import { createStoracha } from '$lib/ipfs'
  import 'toastify-js/src/toastify.css'
    import { getIPFS } from '$lib/drivers';

  let cid = $state<CID | null>(null)
  let carURL = $state<string | null>(null)
  let working = $state(false)
  let signing = $state(false)
  let filename = $state('dl.car')

  const onClick = async (evt: MouseEvent) => {
    working = true
    try {
      const { rootCID: root, serializer } = await neo4j2IPFS({})
      signing = true
      console.debug({ acct: await getAccount(Web3.adapter.wagmiConfig) })
      const signature = await Web3.signMessage(
        root.toString(), { log: console.debug }
      )
      signing = false
      cid = (
        await serializer.addToCAR({ root, signature })
      )
      console.debug({ final: cid.toString(), signature })
      carURL = await serializer.carURL()
      filename = `mïmis.full-tree.${timestamp()}.car`
    } catch(error) {
      console.error({ 'Generation Error': error })
      Toastify({
        text: (error as Error).message,
        duration: 16_000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'center', // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #b09b00, #96003d)",
        },
      }).showToast()
    } finally {
      signing = false
      working = false
    }
  }
</script>

<svelte:head>
  <title>Mïmis: Serialize</title>
  <link rel="icon" href="radioactive%20barrel.svg"/>
</svelte:head>

<heading>
  <h1>Generate a JSON-DAG of the Graph Structure</h1>
</heading>

<main>
  {#if !working}
    <button onclick={onClick}><span>
      Generate a CAR Archive
    </span></button>
  {:else}
    {#if !signing}
      <p>Generating CAR…</p>
    {:else}
      <p>Awaiting Ethereum Wallet Signature…</p>
    {/if}
  {/if}

  <appkit-button />

  {#if carURL}
    <hr/>
    <a class="button" href={carURL} download={filename}>
      <span>Download DAG-JSON CAR: {filename}</span>
    </a>
    <hr/>
    <button onclick={async () => {
      if(!carURL) throw new Error('`carURL` isn’t set.')

      const log = console.debug
      const storacha = await createStoracha({ log })
      const res = await fetch(carURL)
      log?.(`Uploading: "${carURL}".`)
      await storacha.uploadCAR(await res.blob())
      log?.('Upload Complete.')
    }}>
      <span>Upload CAR To Storacha</span>
    </button>
    <hr/>
    <button onclick={async () => {
      if(!carURL) throw new Error('`carURL` isn’t set.')

      const log = console.debug
      const kubo = await getIPFS()
      const res = await fetch(carURL)
      const blob = await res.blob()
      const buffer = await blob.arrayBuffer()
      log?.(`Uploading: "${carURL}".`)
      await kubo.dag.import([new Uint8Array(buffer)])
      log?.('Upload Complete.')
    }}>
      <span>Upload CAR To Kubo</span>
    </button>
  {/if}
  {#if cid}
    <hr/>
    <a class="button" href={toHTTP({ cid: cid.toString() })} target="_blank">
      <span>Browse <code>ipfs://{cid.toString()}</code></span>
    </a>
  {/if}
</main>

<style>
  main {
    margin-block-start: min(25vh, 15rem);
    display: grid;
    place-items: center;
  }

  hr {
    height: 3px;
    border-style: solid;
    width: 50vw;
  }
</style>