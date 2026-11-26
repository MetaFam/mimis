<script lang="ts">
  import { untrack } from 'svelte'
  import Breadcrumbs from './Breadcrumbs.svelte'
  import FileBrowser from './FileBrowser.svelte'
  import relocations, { follow } from '#lib/relocations.svelte.js'

  let {
    path = $bindable([]),
    query = $bindable(''),
    me = null,
    hidden = false,
    onerror = () => {},
    log = () => {},
  }: {
    path?: Array<string>
    query?: string
    me?: string | null
    hidden?: boolean
    onerror?: (msg: string) => void
    log?: (msg: unknown) => void
  } = $props()

  // Only what’s renamed or moved after this pane opens moves it.
  let seen = relocations.latest
  $effect(() => {
    const { latest } = relocations
    if(!latest || latest === seen) return
    seen = latest
    path = follow(untrack(() => path), latest)
  })
</script>

<section id="browse" {hidden}>
  <nav id="crumbs">
    <Breadcrumbs bind:path address={me} {onerror}/>
  </nav>
  <section id="files">
    <FileBrowser bind:path bind:query {me} {onerror} {log}/>
  </section>
</section>

<style>
  #browse, #files {
    display: flex;
    flex-grow: 1;
  }

  #browse {
    flex-direction: column;

    &[hidden] {
      display: none;
    }
  }

  #crumbs {
    border: 2px dashed #999;
  }
</style>