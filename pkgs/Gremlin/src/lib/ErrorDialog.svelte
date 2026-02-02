<script lang="ts">
  import settings from '$lib/settings.svelte'

  let { error = $bindable() } = $props()
  let janusGraphURL = $state(settings.publicJanusGraphURL)
  let dialog = $state<HTMLDialogElement>()

  $effect(() => dialog?.showModal())
</script>

<dialog bind:this={dialog}>
  <p>{error}</p>
  {#if (
    error.startsWith('Connection Error:')
    && settings.janusGraphURL !== settings.publicJanusGraphURL
  )}
    <p>Currently attempting to connect to <code>{settings.janusGraphURL}</code>.</p>
    <form
      id="janus-graph-url"
      onsubmit={(evt) => {
        settings.janusGraphURL = janusGraphURL
      }}
    >
      <p>
        <span>Use</span>
        <input value={janusGraphURL}/>
        <span>?</span>
      </p>
      <menu>
        <button>Cancel</button>
        <button>Ok</button>
      </menu>
    </form>
  {:else}
    <form onsubmit={() => error = null}>
      <menu><button>Ok</button></menu>
    </form>
  {/if}
</dialog>

<style>
  dialog {
    align-self: center;
  }
  menu {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>