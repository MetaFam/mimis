<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { listing } from '#lib/remotes/listing.remote.js'
  import { renameSpot } from '#lib/remotes/renameSpot.remote.js'
  import { nameProblem } from '#lib/names.js'
  import { relocate } from '#lib/relocations.svelte.js'

  let {
    path,
    name,
    onrenamed = () => {},
    onerror = () => {},
    onclose = () => {},
  }: {
    /** The parent’s path. */
    path: Array<string>
    name: string
    onrenamed?: (to: Array<string>) => void
    onerror?: (msg: string) => void
    onclose?: () => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let value = $state(name)
  let dialog = $state<HTMLDialogElement>()
  let input = $state<HTMLInputElement>()
  const problem = $derived(nameProblem(value))

  $effect(() => {
    dialog?.showModal()
    input?.select()
  })

  $effect(() => input?.setCustomValidity(problem ?? ''))

  async function submit(evt: SubmitEvent) {
    evt.preventDefault()
    if(value.trim() === name) {
      dialog?.close()
      return
    }
    try {
      const { path: to } = await renameSpot({ path, from: name, to: value })
      listing({ path }).refresh()
      relocate({ from: [...path, name], to })
      dialog?.close()
      onrenamed(to)
    } catch(err) {
      onerror(isHttpError(err) ? err.body.message : (err as Error).message)
    }
  }
</script>

<dialog bind:this={dialog} {onclose} closedby="any">
  <form onsubmit={submit}>
    <label>
      <span>Rename “{name}” to</span>
      <input
        bind:this={input}
        bind:value
        spellcheck="false"
        aria-describedby="rename-problem"
      />
    </label>
    <p id="rename-problem" class="problem">{problem ?? ''}</p>
    <menu>
      <button type="button" onclick={() => dialog?.close()}>Cancel</button>
      <button type="submit" disabled={problem != null}>Rename</button>
    </menu>
  </form>
</dialog>

<style>
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .problem {
    min-height: 1lh;
    color: color-mix(in oklab, currentcolor 40%, crimson 60%);
  }

  menu {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0;
  }
</style>
