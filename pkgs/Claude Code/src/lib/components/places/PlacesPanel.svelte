<script lang="ts">
  import { PLACE_SECTIONS } from '$lib/fs'
  import PlaceItem from './PlaceItem.svelte'
</script>

<aside class="places">
  {#each PLACE_SECTIONS as section (section.title)}
    <div class="section">
      <h2 class="section-title">{section.title}</h2>
      <ul class="section-list">
        {#each section.places as place (place.path)}
          <PlaceItem {place} />
        {/each}
      </ul>
    </div>
  {/each}
</aside>

<style>
  .places {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 8px 6px;
    background: var(--bg-sidebar);
  }

  .section + .section {
    margin-top: 14px;
  }

  .section-title {
    margin: 0 0 4px;
    padding: 0 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  .section-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
