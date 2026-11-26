<script lang="ts">
  import { resolve } from '$app/paths'
  import RenameDialog from './RenameDialog.svelte'
  import { dropGenerator, navigateOnClick } from '#lib'
  import root from '#assets/root.svg'

  let { path = $bindable([]), address = null, onerror = () => {} }: {
    path: string[]
    address: string | null
    onerror?: (msg: string) => void
  } = $props()
  let selected = $state<number | null>(null)
  /** The crumbs, the root’s & those after it, up to the one renamed. */
  let renaming = $state<Array<string> | null>(null)
</script>

<ol>
  {#each { length: path.length + 1 }, idx}
    {@const toHere = path.slice(0, idx)}
    {@const whole = `${toHere.join('/')}${idx > 0 ? '/' : ''}`}
    {@const { source, target } = dropGenerator({ path: () => toHere })}
    {@const decoded = decodeURI(toHere.at(-1) ?? '¡ℍ𝕖𝕣𝕖!')}
    <li
      class:expanded={selected === idx}
      use:target
      use:source
    >
      <button onclick={() => {
        selected = selected === idx ? null : idx
      }}>⇨</button>
      <a
        href={resolve(whole)}
        title={idx === 0 ? (address ?? '𝙍𝙤𝙤𝙩') : decoded}
        onclick={navigateOnClick(
          { target: toHere, set: (next) => path = next }
        )}
      >
        {#if idx === 0}
          <img
            src={root}
            alt="🪾"
          />
        {:else}
          <span
            draggable="true"
            use:source
          >{decoded}/</span>
        {/if}
      </a>
      {#if idx > 0 && address}
        <button
          class="rename"
          title="Rename “{decoded}”"
          onclick={() => renaming = toHere}
        >✎</button>
      {/if}
    </li>
  {/each}
</ol>
{#if renaming}
  <RenameDialog
    path={renaming.slice(0, -1)}
    name={renaming.at(-1)!}
    {onerror}
    onclose={() => renaming = null}
  />
{/if}

<style>
  ol {
    gap: 0.75em;

    &, & li {
      margin: 0;
      padding: 0.1em;
    }

    &, li {
      display: flex;
      list-style: none;
      align-items: center;
    }

    img {
      display: inline-block;
      width: auto;
      height: 1.5em;
    }

    button.rename {
      opacity: 0;
      margin-inline: 0.5ch 0;

      li:hover &, &:focus-visible {
        opacity: 1;
      }
    }

    button:not(.rename) {
      margin-inline-end: 0.5ch;
      transition: rotate 0.2s ease-in-out;

      .expanded & {
        rotate: 90deg;
      }
    }
  }


  :global(.dragover.cp > a::after) {
    content: ' +';
  }

  :global(.dragover.mv > a::after) {
    content: ' ⬇️';
  }
</style>