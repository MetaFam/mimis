<script lang="ts">
  import type { Entry } from './+page.svelte'
  let { datum }: { datum: Entry } = $props()
</script>

<div class="border-solid rounded p-2 bg-white dark:bg-white/25">
  {datum.title}
</div>