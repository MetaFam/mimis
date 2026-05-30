<script lang="ts">
  import { MAX_ZOOM, MIN_ZOOM, view } from '$lib/state'
</script>

<div class="zoom" title="Zoom ({view.iconSize}px)">
  <button type="button" class="step" aria-label="Zoom out" onclick={() => view.zoom(-16)}>−</button>
  <input
    type="range"
    min={MIN_ZOOM}
    max={MAX_ZOOM}
    step="8"
    bind:value={view.iconSize}
    aria-label="Icon size"
  />
  <button type="button" class="step" aria-label="Zoom in" onclick={() => view.zoom(16)}>+</button>
</div>

<style>
  .zoom {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .step {
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
  }

  .step:hover {
    background: var(--bg-hover);
  }

  input[type='range'] {
    width: 96px;
    accent-color: var(--accent);
    cursor: pointer;
  }
</style>
