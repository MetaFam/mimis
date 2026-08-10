<script lang="ts">
  import { resolve } from '$app/paths'
  import {
    representations, type Representation,
  } from '$lib/remotes/representations.remote'
  import { searchFor } from '$lib/remotes/searchFor.remote'
  import { dropGenerator, navigateOnClick, toHTTP } from '$lib'
  import Folder from '$lib/assets/folder.svg'

  let { path = $bindable([]) }: {
    path: Array<string>
  } = $props()

  const { source: dropSource, target: dropTarget } = (
    dropGenerator({ path: () => path })
  )

  function soleDisplayable(reps?: Array<Representation>) {
    if(!Array.isArray(reps)) throw new Error('`reps` is not an array.')
    reps = reps.filter(
      (rep) => rep.type.startsWith('image/') || rep.type.startsWith('video/')
    )
    if(reps.length !== 1) return false
    const [rep] = reps
    return rep
  }
</script>

<nav class="details" use:dropTarget>
  <ul>
    <!-- {#each await searchFor({ path }) as { name, type, cid } (cid || name)} -->
    {#await searchFor({ path }) then results}
      {#each results as { name, type, cid, id } (`${cid}:${name}`)}
        {@const { target } = dropGenerator(
          { path: () => [...path, name] }
        )}
        <li use:target>
          <a
            href={resolve(
              `${
                path.length > 0 ? '/' : ''
              }${
                path.join('/')
              }/${
                name
              }` as '/'
            )}
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
                data-id={id}
                class:folder={type === 'spot'}
                draggable="true"
              />
            {:else if type === 'spot'}
              <img
                src={Folder}
                class="folder"
                alt="📁"
                use:dropSource
                data-id={id}
                draggable="true"
              />
            {:else}
              <aside>Unknown Type: {type}</aside>
            {/if}
            <span>{name}</span>
          </a>
        </li>
      {/each}
    {/await}
  </ul>
  {#await representations({ path }) then rs}
    {@const sole = soleDisplayable(rs)}
    {@const title = path.at(-1) ?? 'file'}
    {#if sole}
      {@const { cid, type } = sole}
      <figure id="media">
        {#if sole.type.startsWith('image/')}
          <img
            src={toHTTP({ cid })}
            alt={path.at(-1) ?? ''}
            draggable="true"
            use:dropSource
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
  {/await}
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