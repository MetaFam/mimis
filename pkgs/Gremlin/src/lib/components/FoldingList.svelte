<script lang="ts">
  import FoldingList from './FoldingList.svelte'
  import type { Row } from '#lib/pendingTree.js'
  import type { PendingSpot } from '#lib/remotes/pending.remote.js'

  let {
    rows, section, folded, ontoggle, onstage, id = `fold-${section}`,
  }: {
    rows: Array<Row>
    section: string
    folded: (row: Row) => boolean
    ontoggle: (row: Row) => void
    onstage: (spot: PendingSpot) => void
    /** Unique to this list, for its nested lists’ ids. */
    id?: string
  } = $props()

  const label = ({ path, name }: Row) => (path.length === 0 ? '/' : `${name}/`)
  const summary = ({ isNew, added, removed }: PendingSpot) => (
    isNew ? 'new' : `+${added} −${removed}`
  )
</script>

<ul {id}>
  {#each rows as row, idx (row.name)}
    {@const { spot, children } = row}
    {@const nested = `${id}-${idx}`}
    {@const shut = children.length > 0 && folded(row)}
    <li>
      <div class="row">
        {#if children.length > 0}
          <button
            type="button"
            class="fold"
            aria-label={label(row)}
            aria-expanded={!shut}
            aria-controls={shut ? null : nested}
            onclick={() => ontoggle(row)}
          >{folded(row) ? '▶' : '▼'}</button>
        {/if}
        {#if spot}
          <label>
            <input
              type="checkbox"
              checked={spot.staged}
              onchange={() => onstage(spot)}
            />
            {label(row)}
          </label>
        {:else}
          <span class="context">{label(row)}</span>
        {/if}
        {#if shut}
          <span class="count">({row.pending})</span>
        {/if}
        {#if spot}
          <span class="summary">{summary(spot)}</span>
        {/if}
      </div>
      {#if children.length > 0 && !shut}
        <FoldingList
          rows={children}
          {section}
          {folded}
          {ontoggle}
          {onstage}
          id={nested}
        />
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding-inline-start: 0;
  }

  li > :global(ul) {
    padding-inline-start: 2ch;
  }

  .row {
    display: flex;
    align-items: baseline;
    gap: 1ch;
    padding-inline-start: 2ch;
  }

  .summary {
    margin-inline-start: auto;
  }

  button.fold {
    inline-size: 2ch;
    margin-inline-start: -3ch;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .context, .count {
    opacity: 0.7;
  }
</style>
