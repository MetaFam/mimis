<script lang="ts">
  import { settings } from '$lib/settings.svelte'
  import context from '../list/[...path]/context.svelte';

  let pwVisible = $state(false)
</script>

<svelte:head>
  <title>Mïmis: Settings</title>
</svelte:head>

<main>
  <form>
    <fieldset>
      <legend>Settings</legend>
      <fieldset>
        <legend>General</legend>
        <ul id="general">
          <li><label class="line">
            <input
              type="checkbox"
              bind:checked={settings.debugging}
              onchange={() => { settings.save() }}
            />
            <span>:Debug Messages</span>
          </label></li>
        </ul>
      </fieldset>
      <fieldset>
        <legend>IPFS</legend>
        <ul id="ipfs">
          <li><label class="line">
            <input
              type="radio"
              name="provider"
              value="local"
              bind:group={settings.ipfsProvider}
              onchange={() => settings.save()}
            />
            <span>Local IPFS Node</span>
          </label></li>
          <li><label class="line">
            <input
              type="radio"
              name="provider"
              value="storacha"
              bind:group={settings.ipfsProvider}
              onchange={() => settings.save()}
            />
            <span>Storacha IPFS</span>
          </label></li>
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
              {#if settings.ipfsProvider === 'storacha'}
                <legend>Storacha Email Login</legend>
                <input
                  bind:value={settings.storachaEmail}
                  onchange={() => settings.save()}
                />
              {:else}
                <legend>API</legend>
                <input
                  bind:value={settings.ipfsAPI}
                  onchange={() => settings.save()}
                />
              {/if}
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
            <span class="iconed-input">
              <input
                type={pwVisible ? 'text' : 'password'}
                bind:value={settings.neo4jPass}
                onchange={() => settings.save()}
              />
              <button
                onclick={() => pwVisible = !pwVisible}
                class="icon"
              >👁</button>
            </span>
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
  input:is(:not([type]), [type="text"], [type="password"]) {
    width: 97%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    field-sizing: content;
  }
  .line {
    display: flex;
    justify-content: flex-start;

    & > span {
      white-space: nowrap;
    }
  }
  .iconed-input {
    position: relative;
  }
  .iconed-input .icon {
    padding: 0 0.1rem;
    width: fit-content;
    position: absolute;
    right: 0.5rem;
    top: 0.4rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  #neo4j {
    display: grid;
    grid-template-columns: 0fr 1fr;
    align-items: center;
    gap: 0.5em;
    & > span {
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