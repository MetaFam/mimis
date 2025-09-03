<script lang="ts">
  import { untrack } from 'svelte'
  import Display from './Display.svelte'

  let { content = $bindable() }: { content: File } = $props()
  let url = $state<string>()
  let text = $state<string>()
  console.debug({ Content: { url, text } })

  $effect(() => {
    const [, ext] = Array.from(/([^.]+)$/.exec(content.name) ?? [])
    if(/^image\//.test(content.type)) {
      untrack(() => {
        if(url) URL.revokeObjectURL(url)
      })
      url = URL.createObjectURL(content)
    } else {
      content.text().then((t) => text = t)
    }
  })
</script>

<Display
  {url}
  {text}
  type={content.type}
  title={content.name}
/>
