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

	<p>Each user has their own tree and it is possible to browse and subscribe to sections of other users' trees. These subscriptions can be "mounted" into a composite tree beginning with the user's tree and merging mounted nodes into it.</p>

	<p>When a context path is ambiguous, the system can be requested to return an ordered list of possible candidate resources.</p>

	<p>One function of that these ordered lists will enable is a content recommender. Users can create ordered lists ast different context points, and they're combined & collated to generate a likely list of the consensus opinion.</p>

	<p>Structurally, the context tree differs from a traditional filesystem in that files don't have names, per se. Their "name" is simply the file type. <em>(Oftentimes, this is duplicated, like <code>svg.svg</code> because a variety of softwares rely on there being an extension.)</em> Because there is no context information in the filename, it is possible to create multiple routes to a file without the fear that the filename relies on context in the leading path.</p>

	<p>The goal is that the tree should contain a variety of paths describing a resource.</p>
</section>

<style>
	img {
		margin-block: 2rem;
	}
</style>