<script lang="ts">
  import { basename, dirname, formatBytes, formatDate, iconFor, pluralize } from '$lib/fs'
  import { filesystem, navigation, selection } from '$lib/state'
  import FileIcon from '../view/FileIcon.svelte'

  /** Describe the single selection, or fall back to the current folder. */
  const target = $derived.by(() => {
    const path = selection.only ?? navigation.path
    const node = filesystem.fs.resolve(path)
    return node ? { path, node } : null
  })

  const facts = $derived.by(() => {
    if (!target) return []
    const { node, path } = target
    const spec = iconFor(node)
    const rows: { label: string, value: string }[] = [
      { label: 'Type', value: spec.category },
      { label: 'Location', value: dirname(path) },
      { label: 'Modified', value: formatDate(node.modified) },
    ]
    if (node.kind === 'folder') {
      const { files, folders } = filesystem.fs.countOf(node)
      rows.splice(1, 0, { label: 'Contents', value: `${pluralize(folders, 'folder')}, ${pluralize(files, 'file')}` })
      rows.push({ label: 'Total size', value: formatBytes(filesystem.fs.sizeOf(node)) })
    } else {
      rows.splice(1, 0, { label: 'Size', value: formatBytes(node.size) })
    }
    return rows
  })
</script>

<aside class="info-panel">
  {#if selection.size > 1}
    <div class="multi">{pluralize(selection.size, 'item')} selected</div>
  {:else if target}
    <div class="preview">
      <FileIcon node={target.node} size={96} />
      <h2 class="title">{basename(target.path) || 'Root'}</h2>
    </div>
    <dl class="facts">
      {#each facts as fact (fact.label)}
        <dt>{fact.label}</dt>
        <dd>{fact.value}</dd>
      {/each}
    </dl>
  {/if}
</aside>

<style>
  .info-panel {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 14px 12px;
    background: var(--bg-sidebar);
  }

  .preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    word-break: break-word;
  }

  .multi {
    text-align: center;
    color: var(--text-muted);
    margin-top: 20px;
  }

  .facts {
    margin: 18px 0 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 10px;
    font-size: 12px;
  }

  .facts dt {
    color: var(--text-muted);
    font-weight: 600;
  }

  .facts dd {
    margin: 0;
    word-break: break-word;
  }
</style>
