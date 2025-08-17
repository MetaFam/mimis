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

	<p>Mïmis is a collaborative filesystem. It leverages <a href="https://ipfs.io">IPFS</a> to store files & transfer state for a <a href="https://neo4j.org">Neo4j</a> graph describing the connections between files.</p>

	<img src="architecture.svg" alt="Mïmis Architecture"/>

	<p>The structure in Neo4j differs from a traditional file system in several ways:</p>

	<ul>
		<li>
			<p>Files have no names. All the context information is contained in the path leading to the data.</p>
			<p>Much of the structure of the system is in equivalencies between paths:</p>
			<ul>
				<li><p>Some are simple formatting, like <code>∅/book/by/Elizabeth Bear/Shoggoths in Bloom/</code> & <code>∅/book/Elizabeth Bear — Shoggoths in Bloom/</code>. Ideally, <em>any</em> reasonable path should resolve to the resource it represents.</p></li>
				<li><p>Others, convey semantic information, like having <code>∅/Hugo/Novella/2009/winner/</code> or <code>∅/top/science-fiction/#23/</code> be an equivalency to the above paths.</p></li>
			</ul>
		</li>
		<li>
			<p>Each position in the context graph holds <em>(optionally)</em>:</p>
			<ul>
				<li>
					<p>A combination of:</p>
					<ul>
						<li>
							<p>An ordered list of Nöopoints <em>(the Nöosphere is all ideas, a point within that space is a particular concept)</em>. Each Nöopoint represents a different concept that could be meant by the paths leading to this list.</p>
							<p>For each Nöopoint, there are blobs whose contents are in IPFS, at most one per mimetype.</p>
						</li>
						<li>
							<p>An ordered list of mounted contexts. Each user has their own tree differentiated by an Ethereum signing key. A user can mark positions in their tree as equivalent to positions in others' trees.</p>
							<p>There are multiple access modes which combine the lists in different ways. For example, one algorithm might take the first requested resource encountered while another might present a list where each subsequent mount is deduplicated & concatenated to the previous ones.</p>
						</li>
					</ul>
				</li>
			</ul>
		</li>
	</ul>

	<p>One function of that these ordered lists will enable is a content recommender. Users can create ordered lists at different context points, and they're combined & collated to generate a likely list of the consensus opinion.</p>

	<p>Graphs are serialized to DAG-JSON for communication between instances. DAG-JSON cannot handle cycles in the graph. For this reason, all links are "forward" from the current location. There is a special path element, <code>∅</code>, that represents the search should drop back to root of the shared file system. When the system is serialized, if they create cycles, paths containing "<code>∅</code>" are unrolled and saved as though <code>∅</code> is just a normal directory.</p>
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
		text-wrap: pretty;
		text-align: justify;
	}

	ul {
		list-style: disc;

		& li {
			padding-inline-start: 0;
		}
	}

	ul, p {
		max-width: 66ch;
		margin-inline: auto;
	}

</style>