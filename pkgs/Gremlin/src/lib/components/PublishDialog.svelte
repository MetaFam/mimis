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
    if(me && wallet) lists = pending()
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
</script>

<dialog
  id="publish"
  ontoggle={(evt) => {
    if((evt as ToggleEvent).newState === 'open') load()
  }}
>
  <h2>Publish</h2>
  {#if ready && lists}
    {#await lists}
      <img src={spinner} alt="Loading…"/>
    {:then { staged, unstaged }}
      {#each [['Staged', staged], ['Not staged', unstaged]] as const as [name, spots] (name)}
        <section aria-label={name}>
          <h3>{name}</h3>
          <ul>
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
    {:catch err}
      <p>{messageOf(err)}</p>
    {/await}
  {/if}
  <form onsubmit={(evt) => { evt.preventDefault(); publish() }}>
    <label>
      Comment (optional, unsigned)
      <input name="comment" bind:value={comment}/>
    </label>
    <menu>
      <button
        type="button"
        disabled={!ready}
        onclick={() => restage({ all: true })}
      >Stage all</button>
      <button disabled={!ready || busy}>Publish</button>
      <button type="button" command="close" commandfor="publish">Close</button>
    </menu>
  </form>
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
  dialog {
    max-height: 90dvh;
    overflow-y: auto;
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
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0;
  }

  img {
    width: 2em;
  }
</style>
