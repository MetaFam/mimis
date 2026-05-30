<script lang="ts">
  import type { FsNode } from '$lib/fs'
  import FileEntry from './FileEntry.svelte'

  let {
    items,
    ordered,
    size,
  }: { items: { node: FsNode, path: string }[], ordered: string[], size: number } = $props()

  /** Compact view keeps icons small regardless of the zoom slider. */
  const compactSize = $derived(Math.max(16, Math.min(32, Math.round(size / 2))))
</script>

<div class="compact-cols">
  {#each items as item (item.path)}
    <FileEntry node={item.node} path={item.path} {ordered} size={compactSize} compact />
  {/each}
</div>

<style>
  .compact-cols {
    columns: 240px;
    column-gap: 4px;
    padding: 8px;
  }

  .compact-cols :global(.entry.compact) {
    break-inside: avoid;
  }
</style>
