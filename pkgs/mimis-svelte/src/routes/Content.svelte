<script lang="ts">
  let { content }: { content: File } = $props()
  let url = $state<string>()
  let text = $state<string>()

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
      content.text().then((t) => { text = t })
    }
  }
</script>

{#if url}
  <img src={url} alt={content.name} />
{:else}
  <pre>{text}</pre>
{/if}

<style>
</style>