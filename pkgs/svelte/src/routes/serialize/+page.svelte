<script>
    import { neo4j2IPFS } from '$lib/neo4j2DAGJSON'
</script>

<button onclick={(evt) => neo4j2IPFS({ status: console.debug })}>Serialize</button>