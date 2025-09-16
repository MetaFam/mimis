<script lang="ts">
  import { onMount } from 'svelte'

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
  let errored = $state(false)
  let picker = $state(true)

  onMount(() => {
    picker = errored = !!window.showDirectoryPicker
  })

  $effect(() => {
    if(open || !errored) {
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

<section id="dialog">
  <dialog bind:this={dialog}>
    <header>
      <h1>
        {#if errored}
          Import A Directory Tree
        {:else}
          <ol id="header">
            <li>🤪</li>
            <li>Your Browser Isn’t Keeping Up</li>
            <li>🔥🦊</li>
          </ol>
        {/if}
      </h1>
    </header>

    <form onsubmit={submit}>
      {#if picker}
        <label>
          <button type="button" onclick={async () => {
            dir = await window.showDirectoryPicker()
          }}>
            <span>Pick Directory</span>
          </button>
          {#if dir}
            <span>{dir.name}</span>
          {:else}
            <span>No directory selected.</span>
          {/if}
        </label>
      {:else}
        <p>Warning: This program uses <code>show&shy;Directory&shy;Picker()</code> to re&shy;trieve a <code>File&shy;System&shy;Directory&shy;Handle</code> which it can use to tra&shy;verse down into your local file system.</p>
        <p>As of this writing, 26 November 2024, Chrome & Opera are the only browsers that make this function available.</p>
        <p>Specifically, <em>this</em> browser doesn't have support for <code>showDirectoryPicker</code>.</p>
      {/if}
      {#if picker}
        <label>
          <input id="gitignore" type="checkbox" checked />
          <span>Respect <code>.gitignore</code>s</span>
        </label>
        <button><span>Review Import</span></button>
      {:else}
        <button onclick={() => {
          open = false
          errored = true
        }}><span>
          😿 Sorry 😿
        </span></button>
      {/if}
    </form>
  </dialog>
</section>

<style>
  dialog {
    padding: 2rem;
    border-radius: 0.5rem;
    z-index: 100;
    max-width: max(40vw, 35ch);
    text-align: justify;

    & p {
      margin-block: 0rem;
      text-indent: 1em;

      &::first-letter {
        color: cyan;
        scale: 2;
      }
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  button {
    min-width: 100%;
    & span {
      width: 100%;
    }
  }
  header ol, li {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>