<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { listing } from '#lib/remotes/listing.remote.js'
  import { spotId } from '#lib/remotes/spotId.remote.js'
  import { upsertSpot } from '#lib/remotes/upsertSpot.remote.js'

  let {
    self = $bindable(),
    path: container = [],
    onerror = () => {},
  } = $props()
  let path = $state('')

  async function addSpot(evt: SubmitEvent) {
    try {
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
    } catch(err) {
      console.error({ addSpot: err })
      onerror(
        isHttpError(err)
        ? `HTTP Error: ${err.status}: ${err.body.message}`
        : (err as Error).message
      )
    }
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
