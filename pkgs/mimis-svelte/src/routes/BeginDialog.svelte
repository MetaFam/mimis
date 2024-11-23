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
    console.debug({ form, dirs })
  }
</script>

<dialog {open}>
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
      <input id="dir" type="file" webkitdirectory multiple/>
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
    transform: translate(-50%, -50%);
    z-index: 100;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>