<script lang="ts">
  import type { FsNode } from '$lib/fs'
  import { clipboard, commands, selection } from '$lib/state'
  import FileIcon from './FileIcon.svelte'
  import RenameInput from './RenameInput.svelte'
  import { activate, openEntryMenu, selectOnClick } from './interactions'

  let {
    node,
    path,
    ordered,
    size,
    compact = false,
  }: {
    node: FsNode
    path: string
    ordered: string[]
    size: number
    /** Horizontal (compact) layout instead of the vertical icons grid. */
    compact?: boolean
  } = $props()

  const selected = $derived(selection.has(path))
  const cut = $derived(clipboard.isCut(path))
  const renaming = $derived(commands.renaming === path)
</script>

<button
  type="button"
  class="entry"
  class:compact
  class:selected
  class:cut
  style:--icon-size="{size}px"
  onclick={(e) => selectOnClick(e, path, ordered)}
  ondblclick={() => activate(path)}
  oncontextmenu={(e) => openEntryMenu(e, path)}
>
  <FileIcon {node} {size} />
  <span class="label">
    {#if renaming}
      <RenameInput
        value={node.name}
        onCommit={(name) => commands.commitRename(path, name)}
        onCancel={() => commands.cancelRename()}
      />
    {:else}
      <span class="name">{node.name}</span>
    {/if}
  </span>
</button>

<style>
  .entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: calc(var(--icon-size) + 36px);
    padding: 6px 4px;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: none;
    cursor: pointer;
    text-align: center;
  }

  .entry.compact {
    flex-direction: row;
    align-items: center;
    width: 100%;
    gap: 8px;
    text-align: left;
    padding: 3px 6px;
  }

  .entry:hover {
    background: var(--bg-hover);
    border-color: var(--selection-soft);
  }

  .entry.selected {
    background: var(--selection);
    border-color: var(--accent-strong);
    color: var(--text-on-accent);
  }

  .entry.cut {
    opacity: 0.5;
  }

  .label {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    word-break: break-word;
  }

  .compact .name {
    -webkit-line-clamp: 1;
    line-clamp: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
