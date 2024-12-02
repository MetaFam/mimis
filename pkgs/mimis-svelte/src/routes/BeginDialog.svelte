<script lang="ts">
  let {
    open = $bindable(false),
    onsubmit,
  }: {
    open: boolean
    onsubmit?: (
      (dirs: Array<FileSystemDirectoryHandle /* | File */>) => void
    ),
  } = $props()
  let dialog = $state<HTMLDialogElement>()

  $effect(() => {
    if(open) {
      dialog?.showModal()
    } else {
      dialog?.close()
    }
  })

  let dir = $state<FileSystemDirectoryHandle>()

  const submit = async (event: Event) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const dirVal = (
      form.elements.namedItem('dir') as HTMLInputElement
    )
    const dirs = (
      // (dir ? [dir] : Array.from(dirVal?.files ?? []))
      [dir].filter(f => !!f)
    )
    if(dirs.length === 0) {
      throw new Error('No directory selected.')
    }
    onsubmit?.(dirs)
    open = false
  }
</script>

<dialog bind:this={dialog}>
  <h1>Import A Directory Tree</h1>

  <form onsubmit={submit}>
    {#if window.showDirectoryPicker}
      <label>
        <button type="button" onclick={async () => {
          dir = await window.showDirectoryPicker()
        }}>
          Pick Directory
        </button>
        {#if dir}
          <span>{dir.name}</span>
        {:else}
          <span>No directory selected.</span>
        {/if}
      </label>
    {:else}
      <p>Warning: This program uses <code>showDirectoryPicker()</code> to retrieve a <code>FileSystemDirectoryHandle</code>. As of this writing, 26 November 2024, Chrome & Opera are the only browsers that make this function available.</p>
      <p>Specifically, <em>this</em> browser doesn't have support for <code>showDirectoryPicker</code>.</p>
    {/if}
    <label>
      <input id="gitignore" type="checkbox" checked />
      <span>Respect <code>.gitignore</code>s</span>
    </label>
    <button>Review Import</button>
  </form>
</dialog>

<style>
  dialog {
    padding: 2rem;
    border: 1px solid black;
    border-radius: 0.5rem;
    background-color: white;
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    z-index: 100;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>