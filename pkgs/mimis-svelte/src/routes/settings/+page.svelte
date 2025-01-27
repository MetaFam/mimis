<script lang="ts">
  import { settings } from '$lib/settings.svelte';
</script>

<main>
  <form>
    <fieldset>
      <legend>Settings</legend>
      <fieldset>
        <legend>IPFS</legend>
          <ul id="ipfs">
          <li><label>
            <fieldset>
              <legend>Gateway</legend>
              <input
                bind:value={settings.ipfsPattern}
                onchange={() => settings.save()}
              />
            </fieldset>
          </label></li>
          <li><label>
            <fieldset>
              <legend>API</legend>
              <input
                bind:value={settings.ipfsAPI}
                onchange={() => settings.save()}
              />
            </fieldset>
          </label></li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>Neo4j</legend>
        <ul id="neo4j">
          <li><label>
            <span>URL:</span>
            <input
              bind:value={settings.neo4jURL}
              onchange={() => settings.save()}
            />
          </label></li>
          <li><label>
            <span>Username:</span>
            <input
              bind:value={settings.neo4jUser}
              onchange={() => settings.save()}
            />
          </label></li>
          <li><label>
            <span>Password:</span>
            <input
              type="password"
              bind:value={settings.neo4jPass}
              onchange={() => settings.save()}
            />
          </label></li>
          <li><label>
            <span>Results Per Page Limit:</span>
            <input
              bind:value={settings.limit}
              onchange={() => settings.save()}
            />
          </label></li>
        </ul>
      </fieldset>
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
    width: 75ch;
    max-width: 100%;
  }
  fieldset {
    border: 1px solid #CCCC;
    padding: 1rem;
    margin: 0.25rem;
  }
  legend {
    padding-inline: 0.5rem;
  }
  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  #neo4j {
    display: grid;
    grid-template-columns: 0fr 1fr;
    align-items: center;
    gap: 0.5em;
    & span {
      justify-self: end;
    }
    & li, & label {
      display: contents;
    }

    @media (width < 50ch) {
      display: flex;
      flex-direction: column;
      align-items: start;

      & input {
        margin-inline-start: 1em;
      }
    }
  }
</style>