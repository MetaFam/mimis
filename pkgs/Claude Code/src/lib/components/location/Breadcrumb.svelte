<script lang="ts">
  import { ancestry, basename, ROOT } from '$lib/fs'
  import { navigation } from '$lib/state'

  const crumbs = $derived(
    ancestry(navigation.path).map((path) => ({
      path,
      label: path === ROOT ? 'Root' : basename(path),
    })),
  )
</script>

<nav class="breadcrumb" aria-label="Location">
  {#each crumbs as crumb, i (crumb.path)}
    {#if i > 0}<span class="sep" aria-hidden="true">›</span>{/if}
    <button
      type="button"
      class="crumb"
      class:current={crumb.path === navigation.path}
      onclick={() => navigation.go(crumb.path)}
    >
      {#if crumb.path === ROOT}<span class="root-glyph">💻</span>{/if}
      {crumb.label}
    </button>
  {/each}
</nav>

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 1px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border: none;
    border-radius: var(--radius);
    background: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .crumb:hover {
    background: var(--bg-hover);
  }

  .crumb.current {
    font-weight: 600;
  }

  .root-glyph {
    font-size: 14px;
  }

  .sep {
    color: var(--text-muted);
    flex: none;
  }
</style>
