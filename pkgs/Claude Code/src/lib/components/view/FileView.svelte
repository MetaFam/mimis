<script lang="ts">
  import { join } from '$lib/fs'
  import { filesystem, navigation, selection, view } from '$lib/state'
  import IconsView from './IconsView.svelte'
  import CompactView from './CompactView.svelte'
  import DetailsView from './DetailsView.svelte'
  import { openBackgroundMenu } from './interactions'

  const dir = $derived(navigation.path)
  const items = $derived(
    filesystem.listing(dir).map((node) => ({ node, path: join(dir, node.name) })),
  )
  const ordered = $derived(items.map((i) => i.path))

  /** A click that lands on the container itself (not an entry) clears it. */
  function onBackgroundClick(event: MouseEvent) {
    if (event.target === event.currentTarget) selection.clear()
  }
</script>

<div
  class="file-view"
  role="presentation"
  onclick={onBackgroundClick}
  oncontextmenu={(e) => {
    if (e.target === e.currentTarget) openBackgroundMenu(e)
  }}
>
  {#if items.length === 0}
    <div class="empty">This folder is empty.</div>
  {:else if view.mode === 'icons'}
    <IconsView {items} {ordered} size={view.iconSize} />
  {:else if view.mode === 'compact'}
    <CompactView {items} {ordered} size={view.iconSize} />
  {:else}
    <DetailsView {items} {ordered} />
  {/if}
</div>

<style>
  .file-view {
    flex: 1;
    min-width: 0;
    overflow: auto;
    background: var(--bg-view);
  }

  .empty {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
