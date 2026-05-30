<script lang="ts">
  import { filesystem, navigation } from '$lib/state'
  import Breadcrumb from './Breadcrumb.svelte'

  let editing = $state(false)
  let draft = $state('')
  let error = $state(false)

  function startEditing() {
    draft = navigation.path
    error = false
    editing = true
  }

  function commit() {
    const target = draft.trim()
    if (filesystem.fs.isFolder(target)) {
      navigation.go(target)
      editing = false
    } else {
      error = true
    }
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Enter') commit()
    else if (event.key === 'Escape') editing = false
  }

  function focus(node: HTMLInputElement) {
    node.focus()
    node.select()
  }
</script>

<div class="location-bar">
  {#if editing}
    <input
      class="path-input"
      class:error
      type="text"
      bind:value={draft}
      use:focus
      onkeydown={onKey}
      onblur={() => (editing = false)}
      oninput={() => (error = false)}
      spellcheck="false"
    />
  {:else}
    <div
      class="crumb-wrap"
      role="button"
      tabindex="0"
      title="Click to edit location"
      ondblclick={startEditing}
      onkeydown={(e) => e.key === 'F6' && startEditing()}
    >
      <Breadcrumb />
    </div>
    <button type="button" class="edit-toggle" title="Edit location" aria-label="Edit location" onclick={startEditing}>
      ✎
    </button>
  {/if}
</div>

<style>
  .location-bar {
    display: flex;
    align-items: center;
    height: var(--location-height);
    padding: 0 4px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--bg-view);
  }

  .crumb-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    outline: none;
  }

  .edit-toggle {
    flex: none;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--radius);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .edit-toggle:hover {
    background: var(--bg-hover);
  }

  .path-input {
    flex: 1;
    height: 26px;
    border: none;
    border-radius: var(--radius);
    padding: 0 6px;
    background: var(--bg-view);
    color: var(--text);
    outline: none;
  }

  .path-input.error {
    color: #c0392b;
    background: #fdecea;
  }
</style>
