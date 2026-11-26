<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { listing } from '#lib/remotes/listing.remote.js'
  import { notices, type Notice } from '#lib/remotes/notices.remote.js'
  import {
    followMount, keepMount, removeMount,
  } from '#lib/remotes/resolveMount.remote.js'
  import { relocate } from '#lib/relocations.svelte.js'

  let {
    focus = null,
    onerror = () => {},
    onclose = () => {},
  }: {
    /** The one mount, by edge id, whose notice to show. */
    focus?: string | null
    onerror?: (msg: string) => void
    onclose?: () => void
  } = $props()

  let dialog = $state<HTMLDialogElement>()
  $effect(() => { dialog?.showModal() })

  const shown = (path: Array<string>) => `/${path.map((name) => `${name}/`).join('')}`

  async function resolve(how: typeof removeMount, { mount }: Notice) {
    try {
      const { from, to } = await how({ mount })
      notices().refresh()
      for(const path of to ? [from, to] : [from]) {
        listing({ path: path.slice(0, -1) }).refresh()
      }
      if(to) relocate({ from, to })
      if(focus) dialog?.close()
    } catch(err) {
      onerror(isHttpError(err) ? err.body.message : (err as Error).message)
    }
  }
</script>

<dialog bind:this={dialog} {onclose} closedby="any">
  <h2>Moved links</h2>
  <ul>
    {#each (await notices()).filter(({ mount }) => focus == null || mount === focus) as notice (notice.mount)}
      {@const { owner, name, from, to, ownerPath } = notice}
      <li class="notice">
        <p>{owner} moved “{name}” from {shown(from)} to {
          to ? shown(to) : `${shown(ownerPath)} in their tree`
        }</p>
        <menu>
          <li><button onclick={() => resolve(removeMount, notice)}>
            Remove my rename
          </button></li>
          <li><button
            disabled={to == null}
            title={to == null ? 'They moved it where you can’t see it.' : null}
            onclick={() => resolve(followMount, notice)}
          >Follow to {shown(to ?? ownerPath)}</button></li>
          <li><button onclick={() => resolve(keepMount, notice)}>
            Keep here as mine
          </button></li>
        </menu>
      </li>
    {:else}
      <li>No links you’ve renamed have moved.</li>
    {/each}
  </ul>
  <menu>
    <li><button onclick={() => dialog?.close()}>Close</button></li>
  </menu>
</dialog>

<style>
  ul, menu {
    padding: 0;
    list-style: none;
  }

  menu {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
