<script lang="ts">
  import root from '$lib/assets/root.svg'

  let { path = [] } = $props()
</script>

<ol>
  {#each { length: path.length + 1 }, idx}
    {@const whole = `/${path.slice(0, idx).join('/')}${idx > 0 ? '/' : ''}`}
    {@const elem = `${path.at(idx - 1)}`}
    {@const decoded = decodeURI(elem)}
    <li>
      <button>⇨</button>
      <a
        href={whole}
        title={idx === 0 ? '𝙍𝙤𝙤𝙩' : decoded}
      >
        {#if idx === 0}
          <img src={root} alt="🪾"/>
        {:else}
          {decoded}/
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
  }
</style>