<script lang="ts">
  let {
    label,
    glyph,
    disabled = false,
    onSelect,
  }: { label: string, glyph?: string, disabled?: boolean, onSelect: () => void } = $props()
</script>

<button type="button" class="menu-item" {disabled} onclick={onSelect}>
  <span class="glyph">{glyph ?? ''}</span>
  <span class="label">{label}</span>
</button>

<style>
  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 5px 12px 5px 8px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
  }

  .menu-item:hover:not(:disabled) {
    background: var(--selection);
    color: var(--text-on-accent);
  }

  .menu-item:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .glyph {
    width: 18px;
    text-align: center;
    flex: none;
  }
</style>
