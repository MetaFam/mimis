<script lang="ts">
  let { content }: { content: File } = $props()
  let url = $state<string>()

  const [, ext] = Array.from(/([^.]+)$/.exec(content.name) ?? [])
  switch(ext) {
    case 'jpg': case 'jpeg':
    case 'png': case 'gif':
    case 'svg': {
      url = URL.createObjectURL(content)
      break
    }
    default: {
      url = undefined
    }
  }
</script>

{#if url}
  <img src={url} alt={content.name} />
{:else}
  <pre>{content.text()}</pre>
{/if}

<style>
  img {
    max-width: calc(100% - var(--min-browser-width));
  }
</style>