<script lang="ts">
  import { clipboard, commands, contextMenu, selection, view } from '$lib/state'
  import { filesystem } from '$lib/state'
  import MenuItem from './MenuItem.svelte'

  type Entry = { kind: 'item', label: string, glyph: string, disabled?: boolean, run: () => void } | { kind: 'sep' }

  const item = (label: string, glyph: string, run: () => void, disabled = false): Entry => ({
    kind: 'item',
    label,
    glyph,
    run,
    disabled,
  })
  const sep: Entry = { kind: 'sep' }

  /** Build the menu contents from the right-clicked target and selection. */
  const entries = $derived.by<Entry[]>(() => {
    const target = contextMenu.target
    if (target) {
      const node = filesystem.fs.resolve(target)
      const paths = selection.paths
      const list: Entry[] = []
      if (node?.kind === 'folder') list.push(item('Open', '📂', () => commands.open(target)))
      list.push(
        item('Cut', '✂️', () => commands.cut(paths)),
        item('Copy', '📋', () => commands.copy(paths)),
      )
      if (selection.size === 1) list.push(item('Rename', '✏️', () => commands.beginRename(target)))
      list.push(sep, item('Move to Trash', '🗑️', () => commands.remove(paths)))
      return list
    }
    return [
      item('New Folder', '📁', () => commands.newFolder()),
      item('New File', '📄', () => commands.newFile()),
      sep,
      item('Paste', '📥', () => commands.paste(), !clipboard.active),
      sep,
      item('Select All', '▦', () => commands.selectAll()),
      item(view.showHidden ? 'Hide Hidden Files' : 'Show Hidden Files', '◌', () => view.toggleHidden()),
    ]
  })

  let menuWidth = $state(0)
  let menuHeight = $state(0)

  /** Keep the menu fully on-screen by flipping near the right/bottom edges. */
  const left = $derived(Math.min(contextMenu.x, window.innerWidth - menuWidth - 4))
  const top = $derived(Math.min(contextMenu.y, window.innerHeight - menuHeight - 4))

  function choose(run: () => void) {
    run()
    contextMenu.hide()
  }
</script>

<svelte:window
  onpointerdown={(e) => {
    if (contextMenu.open && !(e.target as Element)?.closest?.('.context-menu')) contextMenu.hide()
  }}
  onkeydown={(e) => e.key === 'Escape' && contextMenu.hide()}
  onresize={() => contextMenu.hide()}
/>

{#if contextMenu.open}
  <div
    class="context-menu"
    role="menu"
    tabindex="-1"
    bind:clientWidth={menuWidth}
    bind:clientHeight={menuHeight}
    style:left="{left}px"
    style:top="{top}px"
  >
    {#each entries as entry, i (i)}
      {#if entry.kind === 'sep'}
        <hr class="sep" />
      {:else}
        <MenuItem
          label={entry.label}
          glyph={entry.glyph}
          disabled={entry.disabled}
          onSelect={() => choose(entry.run)}
        />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 180px;
    padding: 4px;
    background: var(--bg-view);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-menu);
    outline: none;
  }

  .sep {
    height: 0;
    margin: 4px 0;
    border: none;
    border-top: 1px solid var(--border);
  }
</style>
