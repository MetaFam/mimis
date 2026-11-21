<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { resolve } from '$app/paths'
  import { deleteSpot } from '#lib/remotes/deleteSpot.remote.js'
  import {
    listing, type Child, type Content,
  } from '#lib/remotes/listing.remote.js'
  import { dropGenerator, navigateOnClick, toHTTP } from '#lib'
  import settings from '#lib/settings.svelte.js'
  import { partsOf } from '#lib/search.js'
  import Folder from '#lib/assets/folder.svg'
  import SearchResults from './SearchResults.svelte'

  let { path = $bindable([]), query = $bindable(''), onerror }: {
    path: Array<string>
    query?: string
    onerror?: (msg: string) => void
  } = $props()

  const { source: dropSource, target: dropTarget } = (
    dropGenerator({ path: () => path })
  )

  type Id = Child['ids'][number]
  type Tile = { name: string, id: Id, from: Id }
  type MenuTarget = { target: Array<string>, tile?: Tile }

  let contextMenu = $state<HTMLElement>()
  let contextPath = $state<Array<string>>([])
  let contextTile = $state<Tile | null>(null)
  let pressTimer: ReturnType<typeof setTimeout> | null = null

  function openMenu(evt: MouseEvent, { target, tile }: MenuTarget) {
    evt.preventDefault()
    evt.stopPropagation()
    contextPath = target
    contextTile = tile ?? null
    if(!contextMenu) return
    contextMenu.style.left = `${evt.clientX}px`
    contextMenu.style.top = `${evt.clientY}px`
    contextMenu.showPopover()
  }

  /** iOS Safari never fires `contextmenu`, so long-press by hand. */
  function pressStart(evt: PointerEvent, entry: MenuTarget) {
    if(evt.pointerType === 'mouse') return
    pressTimer = setTimeout(() => openMenu(evt, entry), 600)
  }

  function pressEnd() {
    if(pressTimer != null) clearTimeout(pressTimer)
    pressTimer = null
  }

  /**
   * The code rides in the folder URI’s query because that is the
   * only part of the URL a web extension can read; it is spent
   * for a token & dropped the moment the editor starts.
   */
  async function editInVSCode() {
    const editor = settings.editorURL.replace(/\/+$/, '')
    // Claimed while the click is still live, so fetching the code
    // below doesn’t cost us the popup.
    const opened = window.open('', '_blank')
    contextMenu?.hidePopover()

    let code: string | null = null
    try {
      const res = await fetch('/api/auth/code')
      if(res.ok) ({ code } = await res.json() as { code: string })
    } catch { /* unpaired: “Mïmis: Set Token” still works */ }

    const folder = (
      `mimis:/${contextPath.join('/')}${
        code == null ? '' : `?code=${encodeURIComponent(code)}`
      }`
    )
    const url = `${editor}/?folder=${encodeURIComponent(folder)}`
    if(opened) {
      opened.location.href = url
    } else {
      window.open(url, '_blank')
    }
  }

  /** Takes the menu’s tile out of this folder, once confirmed. */
  async function deleteTile() {
    contextMenu?.hidePopover()
    if(!contextTile) return
    const { name, id, from } = contextTile
    if(!confirm(`Delete “${name}” from /${path.join('/')}?`)) return
    try {
      await deleteSpot({ what: Number(id), from: Number(from), name })
      listing({ path }).refresh()
    } catch(err) {
      if(!onerror) throw err
      onerror(isHttpError(err) ? err.body.message : (err as Error).message)
    }
  }

  function soleDisplayable(reps?: Array<Content>) {
    if(!Array.isArray(reps)) throw new Error('`reps` is not an array.')
    reps = reps.filter(
      (rep) => rep.type.startsWith('image/') || rep.type.startsWith('video/')
    )
    if(reps.length !== 1) return false
    const [rep] = reps
    return rep
  }

  /** A child as a tile: a folder, or the thumbnail of its content. */
  function tileFor(
    { name, ids: [id], parents: [from], contents, container }: Child
  ) {
    const thumb = soleDisplayable(contents)
    return {
      name,
      id,
      from,
      cid: thumb ? thumb.cid : null,
      type: (container || contents.length === 0) ? 'spot' : 'image',
      types: contents.map(({ type }) => type),
    }
  }
</script>

<nav
  class="details"
  use:dropTarget
  oncontextmenu={(evt) => {
    if(evt.ctrlKey) {
      openMenu(evt, { target: path })
    }
  }}
>
  {#if partsOf(query).length > 0}
    <SearchResults bind:path bind:query/>
  {:else}
    {@const { contents, children } = await listing({ path })}
    <ul>
      {#each children.map(tileFor) as {
        name, type, cid, id, from, types,
      } (name)}
        {@const { target } = dropGenerator(
          { path: () => [...path, name] }
        )}
        {@const editable = {
          target: type === 'spot' ? [...path, name] : path,
          tile: { name, id, from },
        }}
        <li
          use:target
          oncontextmenu={(evt) => {
            if(evt.ctrlKey) {
              openMenu(evt, editable)
            }
          }}
          onpointerdown={(evt) => pressStart(evt, editable)}
          onpointerup={pressEnd}
          onpointercancel={pressEnd}
        >
          <a
            href={resolve([...path, name].join('/'))}
            title={name}
            onclick={navigateOnClick({
              target: [...path, name],
              set: (next) => path = next,
            })}
          >
            {#if cid}
              <img
                src={toHTTP({ cid })}
                alt={name}
                use:dropSource
                data-kind="spot"
                data-id={id}
                data-from={from}
                class:folder={type === 'spot'}
                draggable="true"
              />
            {:else if type === 'spot'}
              <img
                src={Folder}
                class="folder"
                alt="📁"
                use:dropSource
                data-kind="spot"
                data-id={id}
                data-from={from}
                draggable="true"
              />
            {:else}
              <aside>{types.join(', ')}</aside>
            {/if}
            <span>{name}</span>
          </a>
        </li>
      {/each}
    </ul>
    {@const sole = soleDisplayable(contents)}
    {@const title = path.at(-1) ?? 'file'}
    {#if sole}
      {@const { cid, type, id, spot } = sole}
      <figure id="media">
        {#if sole.type.startsWith('image/')}
          <img
            src={toHTTP({ cid })}
            alt={path.at(-1) ?? ''}
            draggable="true"
            use:dropSource
            data-kind="content"
            data-id={id}
            data-from={spot}
          />
        {:else if sole.type.startsWith('video/')}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video src={toHTTP({ cid })} controls></video>
        {:else}
          <object
            data={toHTTP({ cid })}
            {type}
            {title}
          >
            <a
              href={toHTTP({ cid })}
              rel="external"
              target="_blank"
            >
              View {title}
            </a>
          </object>
        {/if}
      </figure>
    {/if}
  {/if}
  <menu class="context" popover bind:this={contextMenu}>
    <li><button onclick={editInVSCode}>
      Edit /{contextPath.join('/')} in VS Code
    </button></li>
    {#if contextTile}
      <li><button onclick={deleteTile}>
        Delete “{contextTile.name}”
      </button></li>
    {/if}
  </menu>
</nav>

<style>
  .details {
    display: flex;
    flex-grow: 1;
    background-color: var(--display-color, #2223);
    border: 2px dashed #9994;


    & ul {
      padding: 0;
      list-style: none;
    }

    &, & a {
      color: contrast-color(var(--display-color, #222));
    }
    a.selected {
      background: radial-gradient(
        circle at 50% 50%,
        color-mix(
          in oklab,
          contrast-color(var(--display-color, #222)) 75%,
          cyan 25%
        ) 0%,
        transparent 100%
      );
    }
    a:hover {
      color: color-mix(
        in oklab,
        contrast-color(var(--display-color, #222)) 75%,
        coral 25%
      );
    }

    & ul {
      align-items: start;
    }

    figure {
      width: 100%;
    }

    & > ul {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 1em;
    }

    & a {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      align-items: center;
      height: 100%;
      place-content: space-evenly;

      &:hover {
        color: lch(
          from LinkText calc(l + 10) calc(c - 10) calc(h + 180)
        );
      }
    }

    & img {
      max-width: calc(var(--zoom, 1) * 15em);
      height: calc(var(--zoom, 1) * 10em);

      &.folder {
        width: calc(var(--zoom, 1) * 15em);
      }
    }

    & #media {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;

      & img, & video, & object {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 90dvh;
        object-fit: contain;
      }
    }

    & menu.context {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0.25rem;
      list-style: none;
      border: 1px solid #9994;
      border-radius: 0.25rem;

      & button {
        font-size: 1em;
        display: block;
        width: 100%;
        text-align: start;
        background: none;
        border: none;
        padding: 0.25rem 0.5rem;
        cursor: pointer;

        &:hover {
          background-color: #9996;
        }
      }
    }

    & span {
      display: inline-block;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 3;
      -webkit-line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }
  }
</style>