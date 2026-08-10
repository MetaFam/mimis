<script lang="ts">
  import { resolve } from '$app/paths'
  import { dropGenerator, navigateOnClick } from '$lib'
  import root from '$lib/assets/root.svg'

  let { path = $bindable([]), address = null }: {
    path: string[]
    address: string | null
  } = $props()
  let selected = $state<number | null>(null)
</script>

<ol>
  {#each { length: path.length + 1 }, idx}
    {@const toHere = path.slice(0, idx)}
    {@const whole = `/${toHere.join('/')}${idx > 0 ? '/' : ''}`}
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
        href={resolve(whole as '/')}
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
    </li>
  {/each}
</ol>

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

    button {
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