<svelte:head>
  <title>The Mïmis File System</title>
</svelte:head>

<header>
  <h1>Mïmis: A Collaborative Filesystem</h1>
</header>

<main>
  <p>Mïmis is a system to aid in the collaborative creation of content. Work is ongoing & there's a smattering of functionality currently:</p>

  <ul>
    <li><a href="/#/spider"><strong>Spider</strong></a>: Will read a directory tree from the local file system and produce an IPFS content archive <em>(CAR file)</em>.</li>
    <li><a href="/#/upload"><strong>Upload</strong></a>: Will take a CAR file and insert its contents into a Neo4j instance used to store the directory tree.</li>
    <li><a href="/#/browse"><strong>Browse</strong></a>: Will allow navigating the structure stored in Neo4j.</li>
    <li><a href="/#/list"><strong>List</strong></a>: Will allow creating ordered lists of content that will be combined with others' lists to create recommendations.</li>
    <li><a href="/#/settings"><strong>Settings</strong></a>: Will allow viewing recommendations based on the lists created by others.</li>
  </ul>
</main>

<style>
  main {
    max-width: 75ch;
    margin-inline: auto;
  }
</style>