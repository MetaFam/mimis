<script lang="ts">
  import Display from "./Display.svelte";

  let {
    datum, handle = $bindable<HTMLDialogElement | null>(null),
  } = $props()
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={handle}
  onclick={() => {
    handle.close()
  }}
  onkeypress={(evt) => {
    if (evt.key === 'z') {
      handle.close()
      evt.stopPropagation()
    }
  }}
>
  <h1>{datum.title}</h1>
  <Display {datum}/>
</dialog>

<style>
  dialog {
    --max-width: 95vw;
    --max-height: calc(95vh - 8rem);
  }
</style>