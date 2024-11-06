<svelte:head>
	<title>About Mïmis</title>
	<meta
		name="description"
		content="Mïmis: Collaborative Filesystem"
	/>
</svelte:head>

<section class="text-column">
	<h1>About Mïmis</h1>

	<p>Mïmis is a collaborative filesystem. It functions by publishing <a href="https://ipld.io/docs/codecs/known/dag-cbor/">CBOR-DAG</a>s describing context trees to <a href="https://ipfs.io">IPFS</a> where they are picked up & cached in a <a href="https://neo4j.org">Neo4j</a> instance.</p>

	<img src="architecture.svg" alt="Mïmis Architecture"/>

	<p>Each user has their own tree and it is possible to browse and subscribe to sections of other users' trees.</p>
</section>

<style>
	img {
		margin-block: 2rem;
	}
</style>