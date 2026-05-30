<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title,
    glyph,
    disabled = false,
    active = false,
    onclick,
    children,
  }: {
    title: string
    glyph?: string
    disabled?: boolean
    active?: boolean
    onclick?: (event: MouseEvent) => void
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class="tbtn"
  class:active
  {title}
  aria-label={title}
  aria-pressed={active}
  {disabled}
  {onclick}
>
  {#if children}{@render children()}{:else}<span class="glyph">{glyph}</span>{/if}
</button>

<style>
  .tbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 30px;
    height: 30px;
    padding: 0 7px;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: none;
    cursor: pointer;
  }

  .tbtn:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--selection-soft);
  }

  .tbtn.active {
    background: var(--selection-soft);
    border-color: var(--accent);
  }

  .tbtn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .glyph {
    font-size: 16px;
    line-height: 1;
  }
</style>
