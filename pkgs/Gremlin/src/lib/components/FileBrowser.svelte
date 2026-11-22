<script lang="ts">
  import { isHttpError } from '@sveltejs/kit'
  import { resolve } from '$app/paths'
  import ChoicesTable from './ChoicesTable.svelte'
  import SearchResults from './SearchResults.svelte'
  import { deleteSpot } from '#lib/remotes/deleteSpot.remote.js'
  import {
    listing, type Child, type Content,
  } from '#lib/remotes/listing.remote.js'
  import { dropGenerator, navigateOnClick, toHTTP } from '#lib'
  import settings, { type DetailsView } from '#lib/settings.svelte.js'
  import { sizeOf } from '#lib/size.js'
  import { partsOf } from '#lib/search.js'
  import Folder from '#assets/folder.svg'
  import PDF from '#assets/pdf.svg'

  let {
    path = $bindable([]),
    query = $bindable(''),
    onerror = () => {},
    log = () => {},
   }: {
    path: Array<string>
    query?: string
    onerror?: (msg: string) => void
    log?: (msg: unknown) => void
  } = $props()

  // Files dropped anywhere on a file’s page are its alternatives. A
  // folder’s page takes them in as Spots named for them.
  const { source: dropSource, target: dropTarget } = (
    dropGenerator({
      path: () => path,
      log,
      placement: async () => {
        const { contents, children } = await listing({ path })
        return (contents.length > 0 && children.length === 0) ? 'alternative' : 'nest'
      },
    })
  )

  function view(next: DetailsView) {
    settings.detailsView = next
    settings.save('detailsView')
  }

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

  /** The best Content, if it can be shown inline (FR-015). */
  function shown(contents?: Array<Content>) {
    if(!Array.isArray(contents)) throw new Error('`contents` is not an array.')
    const [best] = contents
    return best && (
      best.type.startsWith('image/')
      || best.type.startsWith('video/')
      || best.type === 'application/pdf'
    ) ? best : null
  }

  /** A child as a tile: a folder, or its best Content & how many it has. */
  function tileFor(
    { name, ids: [id], parents: [from], contents, container }: Child
  ) {
    const shownBest = shown(contents)
    const cid = shownBest?.type.startsWith('image/') ? shownBest.cid : null
    const type = (container || contents.length === 0) ? 'spot' : 'image'
    const best = contents[0]?.type ?? null
    const [src, alt] = ((cid != null) ? (
      [toHTTP({ cid }), name]
    ) : ((best === 'application/pdf') ? (
      [PDF, '🗊']
    ) : ((type === 'spot') ? (
      [Folder, '📁']
    ) : (
      [null, '🗎']
    ))))
    return {
      name,
      id,
      from,
      cid,
      type,
      best,
      size: contents[0]?.size ?? null,
      choices: contents.length,
      src,
      alt,
      editable: {
        target: type === 'spot' ? [...path, name] : path,
        tile: { name, id, from },
      },
    }
  }
</script>

<nav
  class="details"
  use:dropTarget
  oncontextmenu={(evt) => {
    if(evt.ctrlKey) openMenu(evt, { target: path })
  }}
>
  {#if partsOf(query).length > 0}
    <SearchResults bind:path bind:query/>
  {:else}
    {@const { contents, children } = await listing({ path })}
    {@const tiles = children.map(tileFor)}
    <div class="views" role="group" aria-label="View as">
      <button
        title="Icons"
        aria-pressed={settings.detailsView !== 'table'}
        onclick={() => view('icons')}
      >▦</button>
      <button
        title="Table"
        aria-pressed={settings.detailsView === 'table'}
        onclick={() => view('table')}
      >☰</button>
    </div>
    {#if settings.detailsView === 'table'}
      <div class="table">
        {#if contents.length > 0}
          <ChoicesTable {path} {contents} {onerror}/>
        {/if}
        {#if tiles.length > 0}
          <table class="entries">
            <thead>
              <tr>
                <th scope="col"><span class="hidden">Icon</span></th>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Choices</th>
                <th scope="col">Size</th>
              </tr>
            </thead>
            <tbody>
              {#each tiles as {
                name, type, id, from, best, choices, size, src, alt, editable,
              } (name)}
                {@const { target } = dropGenerator({
                  path: () => [...path, name],
                  log,
                  placement: () => type === 'spot' ? 'nest' : 'version',
                })}
                <tr
                  use:target
                  use:dropSource
                  draggable="true"
                  data-kind="spot"
                  data-id={id}
                  data-from={from}
                  oncontextmenu={(evt) => {
                    if(evt.ctrlKey) openMenu(evt, editable)
                  }}
                  onpointerdown={(evt) => pressStart(evt, editable)}
                  onpointerup={pressEnd}
                  onpointercancel={pressEnd}
                >
                  <td class="icon">
                    {#if src}
                      <img {src} {alt} draggable="false"/>
                    {:else}
                      <span aria-hidden="true">{alt}</span>
                    {/if}
                  </td>
                  <td>
                    <a
                      href={resolve([...path, name].join('/'))}
                      onclick={navigateOnClick({
                        target: [...path, name],
                        set: (next) => path = next,
                      })}
                    >{name}</a>
                  </td>
                  <td class="type">{type === 'spot' ? 'folder' : best}</td>
                  <td class="count">{choices}</td>
                  <td class="count">{size == null ? '' : sizeOf(size)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {:else}
      <ul>
        {#each tiles as {
          name, type, cid, id, from, best, choices, src, alt, editable,
        } (name)}
          <!-- A file dropped on a file’s tile is its new version. -->
          {@const { target } = dropGenerator({
            path: () => [...path, name],
            log,
            placement: () => type === 'spot' ? 'nest' : 'version',
          })}
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
              {#if (
                cid
                || type === 'spot'
                || best === 'application/pdf'
              )}
                <img
                  src={src!}
                  {alt}
                  use:dropSource
                  data-kind="spot"
                  data-id={id}
                  data-from={from}
                  class:folder={type === 'spot'}
                  draggable="true"
                />
              {:else}
                <aside>{best}</aside>
              {/if}
              <span class="resource">{name}</span>
              {#if choices > 1}
                <b class="choices" title="{choices} choices">{choices}</b>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
      {@const sole = shown(contents)}
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
              >View {title}
              </a>
            </object>
          {/if}
        </figure>
      {/if}
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
    position: relative;
    display: flex;
    flex-grow: 1;
    background-color: var(--display-color, #2223);
    border: 2px dashed #9994;

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

    & > ul {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 1em;
      padding: 0;
      list-style: none;
      align-items: start;

      & a {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        align-items: center;
        height: 100%;
        place-content: space-evenly;
        max-width: calc(var(--zoom, 1) * 15em);

        &:hover {
          color: lch(
            from LinkText calc(l + 10) calc(c - 10) calc(h + 180)
          );
        }

        & img {
          max-width: 100%;
          height: calc(var(--zoom, 1) * 10em);
          object-fit: contain;

          &.folder {
            width: calc(var(--zoom, 1) * 15em);
          }
        }

        & span {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          line-clamp: 2;
          overflow: hidden;
        }

        & .choices {
          font-size: 0.75em;
          padding: 0 0.5em;
          border: 1px solid currentColor;
          border-radius: 1em;
        }
      }
    }

    & #media {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;

      & img, & video, & object {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 90dvh;
        object-fit: contain;
      }
    }

    & .views {
      position: absolute;
      top: 0.25em;
      right: 0.25em;
      display: flex;
      gap: 0.25em;
      z-index: 1;

      & button {
        font-size: 1em;
        padding: 0 0.4em;
        border: 1px solid #9996;
        border-radius: 0.25em;
        background: none;
        color: inherit;
        cursor: pointer;

        &[aria-pressed="true"] {
          background-color: #9996;
        }
      }
    }

    & > .table {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding-top: 2em;
    }

    & table.entries {
      width: 100%;
      border-collapse: collapse;

      & th, & td {
        padding: 0.25em 0.5em;
        text-align: start;
        border-bottom: 1px solid #9994;
      }

      & .icon {
        width: 2em;
        text-align: center;

        & img {
          height: 2em;
          width: 2em;
          object-fit: contain;
        }
      }

      & .count {
        text-align: end;
        font-variant-numeric: tabular-nums;
      }
    }

    & .hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
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