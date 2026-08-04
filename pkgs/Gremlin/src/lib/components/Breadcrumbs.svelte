<script lang="ts">
  import { resolve } from '$app/paths'
  import { dropTargetGenerator } from '$lib'
  import root from '$lib/assets/root.svg'
  import { spotId } from '$lib/remotes/spotId.remote'

  let { path = $bindable([]), address = null }: {
    path: string[]
    address: string | null
  } = $props()
  let selected = $state<number | null>(null)
</script>

<ol>
  {#each { length: path.length + 1 }, idx}
    {@const toHere = path.slice(0, idx)}
    {@const destinationId = await spotId({ path: toHere })}
    {@const whole = `/${toHere.join('/')}${idx > 0 ? '/' : ''}`}
    {@const target = dropTargetGenerator({ path })}
    {@const elem = `${toHere.at(-1)}`}
    {@const decoded = decodeURI(elem)}
    <li
      class:expanded={selected === idx}
      use:target
      data-id={destinationId}
    >
      <button onclick={() => {
        selected = selected === idx ? null : idx
      }}>⇨</button>
      <a
        href={resolve(whole as '/')}
        title={idx === 0 ? (address ?? '𝙍𝙤𝙤𝙩') : decoded}
        data-id={destinationId}
      >
        {#if idx === 0}
          <img
            src={root}
            alt="🪾"
          />
        {:else}
          <span
            draggable="true"
            data-id={destinationId}
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

    &, li, a {
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


  :global(.dragover.cp a::after) {
    content: ' +';
  }

  :global(.dragover.mv a::after) {
    content: ' ⬇️';
  }

</style>