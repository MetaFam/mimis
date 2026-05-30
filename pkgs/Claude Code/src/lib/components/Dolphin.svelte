<script lang="ts">
  import { commands, navigation, selection, view } from '$lib/state'
  import Toolbar from './toolbar/Toolbar.svelte'
  import PlacesPanel from './places/PlacesPanel.svelte'
  import FileView from './view/FileView.svelte'
  import InfoPanel from './info/InfoPanel.svelte'
  import StatusBar from './statusbar/StatusBar.svelte'
  import ContextMenu from './menu/ContextMenu.svelte'

  /** Global shortcuts, ignored while typing into an input (rename/location). */
  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (target?.tagName === 'INPUT' || commands.renaming) return

    const ctrl = event.ctrlKey || event.metaKey
    if (ctrl && event.key === 'a') {
      event.preventDefault()
      commands.selectAll()
    } else if (ctrl && event.key === 'c') {
      commands.copy(selection.paths)
    } else if (ctrl && event.key === 'x') {
      commands.cut(selection.paths)
    } else if (ctrl && event.key === 'v') {
      commands.paste()
    } else if (event.altKey && event.key === 'ArrowLeft') {
      navigation.back()
    } else if (event.altKey && event.key === 'ArrowRight') {
      navigation.forward()
    } else if (event.key === 'Backspace') {
      navigation.up()
    } else if (event.key === 'Delete') {
      commands.remove(selection.paths)
    } else if (event.key === 'F2' && selection.only) {
      commands.beginRename(selection.only)
    } else if (event.key === 'Enter' && selection.only) {
      commands.open(selection.only)
    } else if (event.key === 'Escape') {
      selection.clear()
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="dolphin">
  <Toolbar />
  <div class="body">
    {#if view.showPlaces}
      <section class="pane sidebar">
        <PlacesPanel />
      </section>
    {/if}
    <FileView />
    {#if view.showInfo}
      <section class="pane info">
        <InfoPanel />
      </section>
    {/if}
  </div>
  <StatusBar />
</div>

<ContextMenu />

<style>
  .dolphin {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-window);
  }

  .body {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  .pane {
    flex: none;
    height: 100%;
    overflow: hidden;
    /* Native edge handle for resizing the side panels. */
    resize: horizontal;
  }

  .sidebar {
    width: 200px;
    min-width: 140px;
    max-width: 360px;
    border-right: 1px solid var(--border);
  }

  .info {
    width: 240px;
    min-width: 160px;
    max-width: 400px;
    border-left: 1px solid var(--border);
  }
</style>
