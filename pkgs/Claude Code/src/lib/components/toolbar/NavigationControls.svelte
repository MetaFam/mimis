<script lang="ts">
  import { navigation } from '$lib/state'
  import ToolbarButton from './ToolbarButton.svelte'
</script>

<div class="nav-controls">
  <ToolbarButton title="Back" glyph="←" disabled={!navigation.canBack} onclick={() => navigation.back()} />
  <ToolbarButton title="Forward" glyph="→" disabled={!navigation.canForward} onclick={() => navigation.forward()} />
  <ToolbarButton title="Up" glyph="↑" disabled={!navigation.canUp} onclick={() => navigation.up()} />
</div>

<style>
  .nav-controls {
    display: inline-flex;
    gap: 2px;
  }
</style>
