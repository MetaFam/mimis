<script lang="ts">
  /** Inline rename field. Auto-focuses and preselects the filename stem. */
  let {
    value,
    onCommit,
    onCancel,
  }: { value: string, onCommit: (name: string) => void, onCancel: () => void } = $props()

  // svelte-ignore state_referenced_locally -- intentional: snapshot the name once
  let text = $state(value)
  let committed = false

  function commit() {
    if (committed) return
    committed = true
    onCommit(text)
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      committed = true
      onCancel()
    }
  }

  /** Focus the field and preselect everything before the extension dot. */
  function autoselect(node: HTMLInputElement) {
    node.focus()
    const dot = node.value.lastIndexOf('.')
    node.setSelectionRange(0, dot > 0 ? dot : node.value.length)
  }
</script>

<input
  class="rename"
  type="text"
  bind:value={text}
  use:autoselect
  onkeydown={onKey}
  onblur={commit}
  onclick={(e) => e.stopPropagation()}
  ondblclick={(e) => e.stopPropagation()}
/>

<style>
  .rename {
    width: 100%;
    padding: 1px 3px;
    border: 1px solid var(--accent);
    border-radius: 2px;
    background: var(--bg-view);
    color: var(--text);
    outline: none;
    text-align: inherit;
  }
</style>
