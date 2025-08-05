<script lang="ts">
  import { CID } from 'multiformats'
  import { getAccount } from '@wagmi/core'
  import Toastify from 'toastify-js'
  import { timestamp } from '$lib'
  import { neo4j2IPFS } from '$lib/neo4j2DAGJSON'
  import { toHTTP } from '$lib/toHTTP'
  import { Web3 } from '$lib/web3'
  import 'toastify-js/src/toastify.css'

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
      filename = `full-tree.${timestamp()}.car`
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

<main>
  {#if !working}
    <button onclick={onClick}>Generate CAR Archive of the Tree</button>
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

  button {
    max-width: max-content;
    margin-inline: auto;
    margin-block: 0.5rem;
  }

  .button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: 0.5rem;
    box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
    box-sizing: border-box;
    color: #fff;
    display: flex;
    font-size: 1.25rem;
    justify-content: center;
    line-height: 1em;
    max-width: 100%;
    min-width: 140px;
    padding: 3px;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s;

    &:active, &:hover {
      outline: 0;
    }

    & span {
      background-color: rgb(5, 6, 45);
      padding: 16px 24px;
      border-radius: 6px;
      width: 100%;
      height: 100%;
      transition: 300ms;
    }

    &:hover span {
      background: none;
    }

    &:active {
      transform: scale(0.9);
    }
  }
</style>