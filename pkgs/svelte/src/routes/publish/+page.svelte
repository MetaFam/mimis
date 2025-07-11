<script lang="ts">
  import { neo4j2IPFS } from '$lib/neo4j2DAGJSON'
  import { toHTTP } from '$lib/toHTTP';
  import { CID } from 'multiformats'

  let cid: CID | null = null
</script>

<svelte:head>
  <title>Mïmis: Serialize</title>
  <link rel="icon" href="radioactive%20barrel.svg"/>
</svelte:head>

<button onclick={async (evt) => cid = await neo4j2IPFS({ status: console.debug })}>Publish</button>

{#if cid}
  <a href={toHTTP({ cid: cid.toString() })}>Browse <code>ipfs://{cid.toString()}</code></a>
{/if}