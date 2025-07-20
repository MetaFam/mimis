<script lang="ts">
    import { untrack } from "svelte";

  let { content = $bindable() }: { content: File } = $props()
  let url = $state<string>()
  let text = $state<string>()

  $effect(() => {
    const [, ext] = Array.from(/([^.]+)$/.exec(content.name) ?? [])
    switch(ext) {
      case 'jpg': case 'jpeg':
      case 'png': case 'gif':
      case 'svg': {
        untrack(() => {
          if(url) URL.revokeObjectURL(url)
        })
        url = URL.createObjectURL(content)
        break
      }
      default: {
        content.text().then((t) => text = t)
        break
      }
    }
  })
</script>

{#if url}
  <img src={url} alt={content.name} />
{:else}
  <pre>{text}</pre>
{/if}

<style>
  img {
    max-width: 100%;
    max-height: 100%;
  }
</style>