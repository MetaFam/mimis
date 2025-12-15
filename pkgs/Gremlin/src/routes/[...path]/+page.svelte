<script lang="ts">
  import { page } from '$app/state'
  import { searchFor } from '$lib/searchFor.remote'
  import { onMount } from 'svelte'

  const path = page.params.path?.split('/') ?? []
  let files = null
  let menued = false

  onMount(async () => {
    files =   await searchFor({ path })
  })

  let modals = {
    addDirectory: $state<HTMLDialogElement>(),
  }
  function addDirectory() {
    const dir = modals.addDirectory?.showModal()
  }
</script>

<svelte:head>
  <title>ï: {path}</title>
</svelte:head>

<main>
  <section id="actions" class:open={menued}>
    <ul>
      <li><button
        onclick={addDirectory}
        bind:this={modals.addDirectory}
      >Add Directory</button></li>
      <li>Import File</li>
      <li>Import Directory</li>
      <li>Export to CAR</li>
      <li>Export to CBOR-DAG</li>
    </ul>
  </section>
  <section id="locations">
    <section class="general tools">
      <a onclick={() => menued = !menued}>{menued ? '🢗☰🢗' : '🢔⦀🢔'}</a>
      <input type="search"/>
    </section>
    <nav class="system locations">
      <ul>
        <li>Root</li>
        <li>Recent</li>
        <li>Categories</li>
        <li>Volumes</li>
      </ul>
    </nav>
    <nav class="user locations">
      <ul>
        <li><a href="/media/book/by/">Books</a></li>
        <li><a href="/media/movies/entitled/">Movies</a></li>
        <!-- <li><a href="/television/eposodes/ordered/by/internet release/">Latest TV</a></li> -->
        <li><a href="/science/biology/papers/ordered/by/publication date/">Biology Papers</a></li>
        <li><button type="button">➕</button></li>
      </ul>
    </nav>
  </section>
  <section id="details">
    <nav>
      <ul>
      </ul>
    </nav>
  </section>
</main>

<style>
  ul {
    padding: 0;
    list-style: none;

    & li {
      padding: 0.5rem 1rem;
      border: 1px solid #333;
      border-radius: 0.5rem;
      margin-bottom: 0.25rem;
    }
  }

  body {
    margin: 0;
  }

  main {
    display: flex;
    height: 100dvh;

    & #actions {
      width: 0;
      overflow-x: hidden;
      transition: width 0.75s cubic-bezier(0.4, 0.0, 0.2, 1);
      interpolate-size: allow-keywords;
      white-space: nowrap;
      padding-inline-end: 0;
      margin-inline-end: 0;
      border-inline-end: 2px solid #3330;

      &.open {
        width: max-content;
        padding-inline-end: 0.5rem;
        margin-inline-end: 0.5rem;
        border-inline-end: 2px solid #333;
      }
    }

    & #details {
      flex-grow: 1;
    }

    & .general.tools {
      display: flex;
    }
  }
</style>