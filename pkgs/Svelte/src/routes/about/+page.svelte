<svelte:head>
	<title>About Mïmis</title>
	<meta
		name="description"
		content="Mïmis: Collaborative Filesystem"
	/>
	<link rel="icon" href="scroll.svg"/>
</svelte:head>

<section>
	<h1>About Mïmis</h1>

	<p>Mïmis is a collaborative filesystem. It functions by publishing <a href="https://ipld.io/docs/codecs/known/dag-pb">ProtoBuf-DAG</a> UnixFS file systems describing context trees to <a href="https://ipfs.io">IPFS</a> where they are picked up & cached in a <a href="https://neo4j.org">Neo4j</a> instance using content-addressing to deduplicate across versions in a manner reminiscent of <code>git</code>.</p>

	<img src="architecture.svg" alt="Mïmis Architecture"/>

	<p>Each user has their own tree, and it is possible to browse and subscribe to sections of other users' trees. These subscriptions can be "union mounted" into a composite tree beginning with the user's tree, and merging mounted nodes into it.</p>

	<p>When a context path is ambiguous, the system can be requested to return the highest-priority answer or an ordered list of possible candidate resources.</p>

	<p>One function of that these ordered lists will enable is a content recommender. Users can create ordered lists at different context points, and they're combined & collated to generate a likely list of the consensus opinion.</p>

	<p>Structurally, the context tree differs from a traditional filesystem in that files don't have names, per se. Their "name" is simply the file type. <em>(Oftentimes, this is duplicated, like <code inert>svg.svg</code> because a variety of softwares rely on there being an extension.)</em> Because there is no context information in the filename, it is possible to create multiple routes to a file without the fear that the filename relies on context in the leading path.</p>

	<p>The goal is that the tree should contain a variety of paths describing a resource rather than a single fixed point.</p>

	<p></p>
</section>

<style>
	section {
		margin-block: 2rlh;
	}

	img {
		display: block;
		margin-block: 2rem;
		max-height: 95svh;
		margin-inline: auto;
	}

	p {
		initial-letter: 2 2;
		text-indent: 1em;
		margin-block-start: 0.25lh;
		margin-trim: block;
		text-wrap: pretty;
		max-width: 66ch;
		margin-inline: auto;
		text-align: justify;
	}
</style>