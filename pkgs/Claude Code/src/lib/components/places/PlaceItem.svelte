<script lang="ts">
  import type { Place } from '$lib/fs'
  import { navigation } from '$lib/state'

  let { place }: { place: Place } = $props()
  const active = $derived(navigation.path === place.path)
</script>

<li>
  <button type="button" class="place" class:active onclick={() => navigation.go(place.path)} title={place.path}>
    <span class="glyph">{place.glyph}</span>
    <span class="label">{place.label}</span>
  </button>
</li>

<style>
  .place {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: var(--radius);
    background: none;
    cursor: pointer;
    text-align: left;
  }

  .place:hover {
    background: var(--bg-hover);
  }

  .place.active {
    background: var(--selection);
    color: var(--text-on-accent);
  }

  .glyph {
    font-size: 15px;
    width: 18px;
    text-align: center;
    flex: none;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
