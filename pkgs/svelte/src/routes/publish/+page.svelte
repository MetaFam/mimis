<script lang="ts">
  import { CID } from 'multiformats'
  import { neo4j2IPFS, toIPFS } from '$lib/neo4j2DAGJSON'
  import { toHTTP } from '$lib/toHTTP'
  import type { Provider } from '@reown/appkit'
  import { getAccount } from '@wagmi/core'
  import { Web3 } from '$lib/web3'

  let cid: CID | null = null

  const onClick = async (evt: MouseEvent) => {
    const index = await neo4j2IPFS({ status: console.debug })
    console.debug({ acct: await getAccount(Web3.adapter.wagmiConfig) })
    const signature = await Web3.signMessage(index.toString(), { log: console.debug })
    console.debug({ signature })
    cid = await toIPFS({ index, signature })
  }
</script>

<svelte:head>
  <title>Mïmis: Serialize</title>
  <link rel="icon" href="radioactive%20barrel.svg"/>
</svelte:head>

<main>
  <button onclick={onClick}>Publish</button>

  <appkit-button />

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