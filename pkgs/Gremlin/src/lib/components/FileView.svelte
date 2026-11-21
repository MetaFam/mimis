<script lang="ts">
  import Breadcrumbs from './Breadcrumbs.svelte'
  import FileBrowser from './FileBrowser.svelte'

  let {
    path = $bindable([]),
    query = $bindable(''),
    me = null,
    hidden = false,
    onerror,
  }: {
    path?: Array<string>
    query?: string
    me?: string | null
    hidden?: boolean
    onerror?: (msg: string) => void
  } = $props()
</script>

<section id="browse" {hidden}>
  <nav id="crumbs">
    <Breadcrumbs bind:path address={me}/>
  </nav>
  <section id="files">
    <FileBrowser bind:path bind:query {onerror}/>
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