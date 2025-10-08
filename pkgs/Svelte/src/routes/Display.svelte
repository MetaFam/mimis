<script lang="ts">
  let {
    url, text, type, title
  }: {
    url?: string
    text?: string
    type?: string
    title?: string
  } = $props()
  console.debug({ Display: { url, type } })
</script>

{#if !!title}
  <header><h2>{title}</h2></header>
{/if}

{#if url}
  {#if !type || type?.startsWith('image/')}
    <img src={url} alt={title}/>
  {:else if type?.startsWith('video/')}
    <video><source src={url} {type}/></video>
  {/if}
{/if}

{#if text}
  <pre>{text}</pre>
{/if}

<style>
  img, video, pre {
    width: 100%;
    max-height: 100vh;
  }
</style>