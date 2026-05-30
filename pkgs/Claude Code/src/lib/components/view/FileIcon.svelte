<script lang="ts">
  import { iconFor, type FsNode } from '$lib/fs'

  let { node, size = 48 }: { node: FsNode, size?: number } = $props()
  const spec = $derived(iconFor(node))
</script>

<span class="file-icon" style:--icon-size="{size}px" style:--accent={spec.color} title={spec.category}>
  {spec.glyph}
</span>

<style>
  .file-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size);
    height: var(--icon-size);
    font-size: calc(var(--icon-size) * 0.72);
    line-height: 1;
    user-select: none;
    /* A faint accent halo echoing the file category. */
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.18));
  }
</style>
