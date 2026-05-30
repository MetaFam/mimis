<script lang="ts">
  import { commands, view } from '$lib/state'
  import LocationBar from '../location/LocationBar.svelte'
  import NavigationControls from './NavigationControls.svelte'
  import ViewModeSwitch from './ViewModeSwitch.svelte'
  import ToolbarButton from './ToolbarButton.svelte'
</script>

<div class="toolbar">
  <ToolbarButton
    title="Show Places panel"
    glyph="☰"
    active={view.showPlaces}
    onclick={() => view.togglePlaces()}
  />

  <NavigationControls />

  <div class="location">
    <LocationBar />
  </div>

  <ToolbarButton title="New folder" glyph="📁+" onclick={() => commands.newFolder()} />

  <span class="divider" aria-hidden="true"></span>

  <ViewModeSwitch />

  <span class="divider" aria-hidden="true"></span>

  <ToolbarButton
    title="Show hidden files"
    glyph="◌"
    active={view.showHidden}
    onclick={() => view.toggleHidden()}
  />
  <ToolbarButton
    title="Information panel"
    glyph="ⓘ"
    active={view.showInfo}
    onclick={() => view.toggleInfo()}
  />
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--toolbar-height);
    padding: 0 6px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
  }

  .location {
    flex: 1;
    min-width: 0;
  }

  .divider {
    width: 1px;
    height: 22px;
    background: var(--border);
    margin: 0 2px;
  }
</style>
