<script lang="ts">
  import Display from "./Display.svelte";

  let {
    datum,
    handle = $bindable<HTMLDialogElement | null>(null),
  } = $props()
</script>

<dialog bind:this={handle}>
  <h1>Delete {datum.title}?</h1>
  <button
    id="x"
    commandfor="close"
    onclick={() => handle?.close()}
  >⨯</button>
  <form onsubmit={(evt) => evt.preventDefault() }>
    <Display {datum}/>
    <nav>
      <button
        id="cancel"
        type="button"
        accesskey="c"
        commandfor="close"
        onclick={() => handle?.close()}
      ><u>C</u>ancel</button>
      <button
        id="delete"
        accesskey="r"
        onclick={() => {
          const evt = new CustomEvent(
            'datum-delete',
            { detail: { id: datum.id }, bubbles: true },
          )
          handle.dispatchEvent(evt)
        }}
      ><u>R</u>emove</button>
    </nav>
  </form>
</dialog>

<style>
  form {
    position: relative;
    display: block;
    --max-height: 50vh;
  }
  nav {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  button#x {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    padding: 0.25rem;
    border-radius: 50%;
    background-color: transparent;
    border: none;

    &:hover {
      color: yellow;
    }
  }
  button#cancel {
    background-color: blue;
    color: white;
  }
  button#delete {
    background-color: red;
    color: white;
  }
</style>