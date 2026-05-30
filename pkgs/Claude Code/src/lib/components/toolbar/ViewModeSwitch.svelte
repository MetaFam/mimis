<script lang="ts">
  import type { ViewMode } from '$lib/fs'
  import { view } from '$lib/state'
  import ToolbarButton from './ToolbarButton.svelte'

  const modes: { mode: ViewMode, title: string, glyph: string }[] = [
    { mode: 'icons', title: 'Icons', glyph: '▦' },
    { mode: 'compact', title: 'Compact', glyph: '☰' },
    { mode: 'details', title: 'Details', glyph: '≣' },
  ]
</script>

<div class="mode-switch" role="group" aria-label="View mode">
  {#each modes as m (m.mode)}
    <ToolbarButton
      title={m.title}
      glyph={m.glyph}
      active={view.mode === m.mode}
      onclick={() => view.setMode(m.mode)}
    />
  {/each}
</div>

<style>
  .mode-switch {
    display: inline-flex;
    gap: 2px;
  }
</style>
