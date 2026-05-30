<script lang="ts">
  import type { FsNode } from '$lib/fs'
  import FileEntry from './FileEntry.svelte'

  let {
    items,
    ordered,
    size,
  }: { items: { node: FsNode, path: string }[], ordered: string[], size: number } = $props()
</script>

<div class="icons-grid" style:--icon-size="{size}px">
  {#each items as item (item.path)}
    <FileEntry node={item.node} path={item.path} {ordered} {size} />
  {/each}
</div>

<style>
  .icons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, calc(var(--icon-size) + 36px));
    gap: 6px;
    align-content: start;
    justify-content: start;
    padding: 8px;
  }
</style>
