<script lang="ts">
  import { addFiles } from "$lib/ipfs";

  let {
    self = $bindable(),
    path = [],
    onerror = () => {},
  } = $props()
  let files = $state<FileList | null>(null)

  async function filesAdded(evt: SubmitEvent) {
    try {
      evt.preventDefault()
      if(!self) throw new Error('¿How were these files submitted?')
      const form = evt.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      if((evt.submitter as HTMLInputElement)?.value !== 'cancel') {
        const files = formData.getAll('files') as Array<File>
        await addFiles({ files, path })
      }
      self.requestClose()
      form.reset()
    } catch(err) {
      console.error({ 'addFiles func': err })
      onerror((err as Error).message)
    }
  }
</script>

<dialog id="add-files" bind:this={self}>
  <form onsubmit={filesAdded} class="adder">
    <fieldset>
      <legend>Files to Add</legend>
      <input
        bind:files
        name="files"
        type="file"
        multiple
      />
      <menu>
        <button
          name="action"
          value="add"
          disabled={(files ?? []).length < 1}
          class="add"
        >Add</button>
        <button
          type="button"
          command="close"
          commandfor="add-files"
          class="cancel"
        >Cancel</button>
      </menu>
    </fieldset>
  </form>
</dialog>
