<script lang="ts">
  import { Settings, settings } from '$lib/settings.svelte'
  let {
    self = $bindable(),
    onsubmit = $bindable(),
  } = $props()
  const values = new Settings(settings)

  $effect(() => {
    const listener = (evt: MouseEvent) => {
      const bbox = self.getBoundingClientRect()
      const clickedIn = (
        evt.clientX >= bbox.left && evt.clientX <= bbox.right
        && evt.clientY >= bbox.top && evt.clientY <= bbox.bottom
      )
      if(
        self.open && !clickedIn
        && !(
          evt.target instanceof HTMLButtonElement
          && evt.target?.classList.contains('menu-open')
        )
      ) {
        self.close()
      }
    }
    document.addEventListener('click', listener)
    return () => document.removeEventListener('click', listener)
  })

  function submit(evt: SubmitEvent) {
    onsubmit?.(evt)
    settings.values = values
    settings.save()
    self.close()
  }
</script>

<dialog bind:this={self}>
  <form onsubmit={submit}>
    <fieldset>
      <legend>General Settings</legend>
      <label>
        <input type="checkbox" bind:checked={values.debugging}/>
        <span>Debug Logging</span>
      </label>
      <label>
        <span>Details Zoom</span>
        <input
          type="text" inputmode="numeric"
          pattern="[0-9]*\.?[0-9]*"
          bind:value={settings.detailsZoom}
        />
      </label>
    </fieldset>
    <fieldset>
      <legend>IPFS Settings</legend>
      <label>
        <span>Gateway URL Pattern</span>
        <input bind:value={values.ipfsURLPattern}/>
      </label>
    </fieldset>
    <fieldset>
      <legend>Kubo Settings</legend>
      <label>
        <input type="checkbox" bind:checked={values.useKubo}/>
        <span>Save to Kubo</span>
      </label>
      <label>
        <span>URL</span>
        <input bind:value={values.ipfsAPI}/>
      </label>
      <label>
        <span>Username</span>
        <input
          bind:value={values.kuboUsername}
          placeholder="Leave blank to disable authentication…"
          autocomplete="username"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          bind:value={values.kuboPassword}
          autocomplete="new-password"
        />
      </label>

    </fieldset>
    <menu>
      <button type="button" onclick={(evt) => {
        values.values = settings
        self.close()
      }}>Cancel</button>
      <button>Save</button>
    </menu>
  </form>
</dialog>

<style>
  :root {
    font-size: 13pt;
  }

  :global(input), :global(button) {
    font-size: 13pt;
    padding: 0.25em;
    border-radius: 0.25rem;
  }

  label {
    display: flex;
    margin-inline-start: 1rem;
    align-items: center;

    & span::after {
      content: ': ';
    }

    & input + span::after {
      content: '';
    }

    span + input {
      margin-inline-start: 0.25rem;
      flex-grow: 1;
      field-sizing: content;
    }
  }

  form, fieldset {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  form > menu {
    display: flex;
    margin: 0;

    & > button {
      margin-block-start: 1rem;
      margin-inline-end: 0.5rem;

      &:first-of-type {
        margin-inline-start: auto;
      }
    }
  }
</style>