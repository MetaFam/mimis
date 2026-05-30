<script lang="ts">
  import { formatBytes, formatDate, iconFor, pluralize, type FsNode, type SortKey } from '$lib/fs'
  import { clipboard, commands, selection, view } from '$lib/state'
  import FileIcon from './FileIcon.svelte'
  import RenameInput from './RenameInput.svelte'
  import { activate, openEntryMenu, selectOnClick } from './interactions'

  let {
    items,
    ordered,
  }: { items: { node: FsNode, path: string }[], ordered: string[] } = $props()

  const columns: { key: SortKey, label: string, className: string }[] = [
    { key: 'name', label: 'Name', className: 'col-name' },
    { key: 'size', label: 'Size', className: 'col-size' },
    { key: 'kind', label: 'Type', className: 'col-type' },
    { key: 'modified', label: 'Modified', className: 'col-date' },
  ]

  function sizeLabel(node: FsNode): string {
    return node.kind === 'folder' ? pluralize(node.children?.length ?? 0, 'item') : formatBytes(node.size)
  }
</script>

<table class="details">
  <thead>
    <tr>
      {#each columns as col (col.key)}
        <th
          class={col.className}
          class:active={view.sortKey === col.key}
          onclick={() => view.sortBy(col.key)}
        >
          {col.label}
          {#if view.sortKey === col.key}
            <span class="arrow">{view.sortDir === 'asc' ? '▲' : '▼'}</span>
          {/if}
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each items as { node, path } (path)}
      <tr
        class:selected={selection.has(path)}
        class:cut={clipboard.isCut(path)}
        onclick={(e) => selectOnClick(e, path, ordered)}
        ondblclick={() => activate(path)}
        oncontextmenu={(e) => openEntryMenu(e, path)}
      >
        <td class="col-name">
          <FileIcon {node} size={16} />
          {#if commands.renaming === path}
            <RenameInput
              value={node.name}
              onCommit={(name) => commands.commitRename(path, name)}
              onCancel={() => commands.cancelRename()}
            />
          {:else}
            <span class="name">{node.name}</span>
          {/if}
        </td>
        <td class="col-size">{sizeLabel(node)}</td>
        <td class="col-type">{iconFor(node).category}</td>
        <td class="col-date">{formatDate(node.modified)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .details {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    text-align: left;
    font-weight: 600;
    padding: 5px 10px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
  }

  thead th:hover {
    background: var(--bg-hover);
  }

  th.active {
    color: var(--accent-strong);
  }

  .arrow {
    font-size: 9px;
    vertical-align: middle;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover {
    background: var(--bg-hover);
  }

  tbody tr.selected {
    background: var(--selection);
    color: var(--text-on-accent);
  }

  tbody tr.cut {
    opacity: 0.5;
  }

  td {
    padding: 3px 10px;
    border-bottom: 1px solid #f0f0f1;
    white-space: nowrap;
  }

  .col-name {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 50%;
  }

  .col-name .name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col-size,
  .col-type {
    color: var(--text-muted);
  }

  tr.selected .col-size,
  tr.selected .col-type,
  tr.selected .col-date {
    color: var(--text-on-accent);
  }
</style>
