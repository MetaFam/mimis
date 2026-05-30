<script lang="ts">
  import { formatBytes, pluralize } from '$lib/fs'
  import { filesystem, navigation, selection, view } from '$lib/state'
  import ZoomSlider from './ZoomSlider.svelte'

  const entries = $derived(filesystem.listing(navigation.path))

  /** Either a selection summary or a folder summary, like Dolphin's bar. */
  const summary = $derived.by(() => {
    if (selection.size > 0) {
      const nodes = selection.paths.map((p) => filesystem.fs.resolve(p)).filter((n) => n !== null)
      const bytes = nodes.reduce((sum, n) => sum + filesystem.fs.sizeOf(n), 0)
      return `${pluralize(selection.size, 'item')} selected (${formatBytes(bytes)})`
    }
    const folders = entries.filter((n) => n.kind === 'folder').length
    const files = entries.length - folders
    if (entries.length === 0) return 'No items'
    return [folders && pluralize(folders, 'folder'), files && pluralize(files, 'file')]
      .filter(Boolean)
      .join(', ')
  })

  const showZoom = $derived(view.mode !== 'details')
</script>

<footer class="status-bar">
  <span class="summary">{summary}</span>
  {#if showZoom}<ZoomSlider />{/if}
</footer>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--statusbar-height);
    padding: 0 10px;
    background: var(--bg-header);
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
