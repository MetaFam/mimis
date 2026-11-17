<script lang="ts">
  import { listing } from '$lib/remotes/listing.remote'
  import { spotId } from '$lib/remotes/spotId.remote'
  import { upsertSpot } from '$lib/remotes/upsertSpot.remote'

  let {
    self = $bindable(),
    path: container = [],
  } = $props()
  let path = $state('')

  async function addSpot(evt: SubmitEvent) {
    evt.preventDefault()
    if(!self) throw new Error('¿How was this directory submitted?')

    const form = evt.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
      const terminal = formData.getAll('path') as Array<string>
      const containerId = await spotId({ path: container })
      await upsertSpot({ containerId, subdirectory: terminal })
      void listing({ path: container }).refresh()
    }
    self.requestClose()
    form.reset()
  }
</script>

<dialog id="add-spot" bind:this={self}>
  <form onsubmit={addSpot} class="adder">
    <fieldset>
      <legend>Path to New Spot</legend>
      <input name="path" bind:value={path}/>
      <menu>
        <button
          name="action"
          value="add"
          disabled={path?.trim() === ''}
          class="add button"
        >Add</button>
        <button
          type="button"
          command="close"
          commandfor="add-spot"
          class="cancel button"
        >Cancel</button>
      </menu>
    </fieldset>
  </form>
</dialog>

<style>
</style>
