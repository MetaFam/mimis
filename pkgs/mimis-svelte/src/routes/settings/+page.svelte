<script type="ts">
  import { settings } from '$lib/settings.svelte';
</script>

<main>
  <form>
    <fieldset>
      <legend>Settings</legend>
      <label>
        <fieldset>
          <legend>IPFS Conversion</legend>
          <input bind:value={settings.ipfsConversion}/>
        </fieldset>
      </label>
    </fieldset>
  </form>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  form {
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  fieldset {
    border: 1px solid #CCCC;
    padding: 1rem;
    margin: 0.25rem;
  }
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
</style>