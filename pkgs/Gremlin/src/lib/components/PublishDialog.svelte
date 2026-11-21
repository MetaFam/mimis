<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { getConnection, signTypedData } from '@wagmi/core'
  import { toHTTP } from '#lib'
  import { getWagmiAdapter } from '#lib/appkit.js'
  import { pending, type PendingSpot } from '#lib/remotes/pending.remote.js'
  import { stage } from '#lib/remotes/stage.remote.js'
  import { preparePublish } from '#lib/remotes/preparePublish.remote.js'
  import { commitPublish } from '#lib/remotes/commitPublish.remote.js'
  import spinner from '#lib/assets/spinner.svg'

  let { me = null }: { me?: string | null } = $props()

  type Included = Array<{ path: Array<string>, reason: string }>
  type Status =
    | { kind: 'idle' }
    | { kind: 'message', text: string }
    | { kind: 'waiting', included: Included }
    | { kind: 'published', cid: string, sequence: number, comment: string }

  let lists = $state<ReturnType<typeof pending>>()
  let wallet = $state<string | null>(null)
  let comment = $state('')
  let busy = $state(false)
  let status = $state<Status>({ kind: 'idle' })
  const ready = $derived(!!me && !!wallet)

  const config = () => getWagmiAdapter().wagmiConfig
  const label = (path: Array<string>) => (
    path.length === 0 ? '/' : `${path.join('/')}/`
  )
  const summary = ({ isNew, added, removed }: PendingSpot) => (
    isNew ? 'new' : `+${added} −${removed}`
  )
  const say = (text: string): Status => ({ kind: 'message', text })
  const why: Record<string, string> = {
    connect: 'to connect', new: 'new', move: 'moved',
  }
  const messageOf = (err: unknown) => (
    isHttpError(err) ? err.body.message : (err as Error).message
  )

  function load() {
    wallet = getConnection(config()).address ?? null
    if(!me || !wallet) return
    // `pending()` answers from the cache, as it stood when the dialog
    // last opened, & the tree may have changed since.
    const fresh = pending()
    void fresh.refresh()
    lists = fresh
  }

  async function restage(change: Parameters<typeof stage>[0]) {
    try {
      await stage(change)
      lists = pending()
    } catch(err) {
      status = say(messageOf(err))
    }
  }

  async function publish() {
    busy = true
    try {
      wallet = getConnection(config()).address ?? null
      if(!wallet) return
      if(wallet.toLowerCase() !== me?.toLowerCase()) {
        status = say(
          `Your wallet is connected as ${wallet}, but you’re signed in as ${me}.`
        )
        return
      }
      const prepared = await preparePublish(comment ? { comment } : {})
      if(prepared.nothing) {
        status = say('Nothing is staged to publish.')
        return
      }
      status = { kind: 'waiting', included: prepared.included }
      const { typedData } = prepared
      let signature: string
      try {
        signature = await signTypedData(config(), {
          ...typedData,
          message: {
            ...typedData.message,
            sequence: BigInt(typedData.message.sequence),
          },
        })
      } catch {
        status = say('Publish cancelled. Your changes are still pending.')
        return
      }
      const { cid, sequence } = (
        await commitPublish({ plan: prepared.plan, signature })
      )
      status = { kind: 'published', cid, sequence, comment }
      lists = pending()
    } catch(err) {
      status = say(messageOf(err))
    } finally {
      busy = false
    }
  }

  const titleCase = (s: string): string => (
    s.toLowerCase()
    .replace(/[_-]+/, ' ')
    .replace(/\b\p{L}/gu, c => c.toUpperCase())
  )
</script>

<dialog
  id="publish"
  ontoggle={(evt) => {
    if((evt as ToggleEvent).newState === 'open') load()
  }}
>
  <header>
    <h2>Publish</h2>
    <button command="close" commandfor="publish">✘</button>
  </header>
  {#if ready && lists}
    {#await lists}
      <img src={spinner} alt="Loading…"/>
    {:then { staged, unstaged }}
      {#each Object.entries({ staged, unstaged }) as [id, spots] (id)}
        {@const name = titleCase(id)}
        <section aria-label={name}>
          <h3>{name}</h3>
          <ul>
            {#if id === 'unstaged'}
              <label id="mass-select">
                <input
                  type="checkbox"
                  checked={false}
                  id="check-all"
                  class:betwixt={staged.length > 0 && unstaged.length > 0}
                  onchange={() => {
                    const list = staged.length === 0 ? unstaged : staged
                    const ids = list.map(({ id }) => id)
                    restage({ ids, staged: staged.length === 0})
                  }}
                />
                {#if staged.length === 0}
                  <span>↑↑↑ Stage Everything ↑↑↑</span>
                {:else}
                  <span>↓↓↓ Unstage Everything ↓↓↓</span>
                {/if}
              </label>
            {/if}
            {#each spots as spot (spot.id)}
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={spot.staged}
                    onchange={() => restage({ ids: [spot.id], staged: !spot.staged })}
                  />
                  {label(spot.path)}
                </label>
                <span>{summary(spot)}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
      <form onsubmit={(evt) => { evt.preventDefault(); publish() }}>
        <label>
          Comment (optional, unsigned)
          <input name="comment" bind:value={comment}/>
        </label>
        <menu>
          <button
            disabled={!ready || busy || staged.length === 0}
            class="add"
          >Publish</button>
          <button
            type="button"
            command="close"
            commandfor="publish"
            class="cancel"
          >Close</button>
        </menu>
      </form>
    {:catch err}
      <p>{messageOf(err)}</p>
    {/await}
  {/if}
  <output aria-live="polite">
    {#if !ready}
      Connect a wallet to publish.
    {:else if status.kind === 'message'}
      {status.text}
    {:else if status.kind === 'waiting'}
      {#if status.included.length > 0}
        <p>Also included so the staged Spots stay connected:</p>
        <ul>
          {#each status.included as { path, reason } (path.join('/'))}
            <li>{label(path)} <span>{why[reason]}</span></li>
          {/each}
        </ul>
      {/if}
      <p>Waiting for your wallet…</p>
    {:else if status.kind === 'published'}
      <p>
        Published Update {status.sequence}:
        <a
          href={toHTTP({ cid: status.cid })}
          rel="external"
          target="_blank"
        >{status.cid}</a>
      </p>
      {#if status.comment}
        <p>Comment: {status.comment} (yours, unsigned)</p>
      {/if}
    {/if}
  </output>
</dialog>

<style>
  #check-all + span {
    font-style: italic;
    font-weight: bolder;
  }

  #check-all::before {
    content: "";
    width: 0.7em;
    height: 0.7em;
    transform: scale(0);
    transition: transform 120ms ease-in-out;
    background: currentColor;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  #check-all:checked::before { transform: scale(1); }

  #check-all:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  header {
    display: flex;
    justify-content: space-between;

    & h2 {
      margin: 0;
    }

    & button {
      background: transparent;
      border: none;
    }
  }

  dialog {
    max-height: 90dvh;
    overflow-y: auto;
    min-width: 33dvw;
  }

  section ul {
    padding-inline-start: 0;
    list-style: none;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 1ch;
  }

  menu {
    display: flex;
    justify-content: flex-start;
    gap: 0.5rem;
    padding: 0;
  }

  img {
    width: 2em;
  }
</style>
