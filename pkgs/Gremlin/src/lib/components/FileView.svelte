<script lang="ts">
    import Breadcrumbs from "./Breadcrumbs.svelte";
    import FileBrowser from "./FileBrowser.svelte";

  const { path = $bindable([]), me } = $props()
</script>

<section id="browse">
  <nav id="crumbs">
    <Breadcrumbs {path} address={me}/>
  </nav>
  <section id="files">
    <FileBrowser {path}/>
  </section>
</section>

<style>
  #browse, #files {
    display: flex;
    flex-grow: 1;
  }

  #browse {
    flex-direction: column;
  }

  #crumbs {
    border: 2px dashed #999;
  }
</style>