<script lang="ts">
  import { settings } from '$lib/settings.svelte'

  let { elements = $bindable([]) } = $props()
  let last = $state<HTMLInputElement | null>(null)
  let { debugging: debug } = settings
  let form = $state<HTMLFormElement | null>(null)

  function insertAt(idx: number) {
    elements = (
      [...elements.slice(0, idx + 1), '', ...elements.slice(idx + 1)]
    )
  }

  $effect(() => last?.focus())
</script>

<form
  bind:this={form}
  onsubmit={(evt) => {
    evt.preventDefault()
    const submitter = evt.submitter?.id
    if(!submitter) throw new Error('No submitter.')
    if(debug) console.debug({ submitter })
    const [_, id] = Array.from(submitter.match(/^text-(\d+)$/) ?? [])

    if(id) {
      const shifted = Number(id)
      if(debug) console.debug({ 'Inserting At': shifted })
      insertAt(shifted)
    } else if(['before', 'more'].includes(submitter)) {
      const op = submitter === 'before' ? 'unshift' : 'push'
      if(debug) console.debug({ op })
      elements[op]('')
    } else if(submitter === 'clear') {
      elements = ['']
    } else {
      throw new Error(`Unrecognized Submitter Id: "${submitter}"`)
    }
  }}
>
  <ol>
    <li><button id="clear">∅</button></li>
    <li><button id="before">+</button></li>
    {#each elements as _elem, idx}
      <li class:single={elements.length <= 1}>
        <input
          id="text-{idx}"
          bind:value={elements[idx]}
          bind:this={last}
          onkeydown={function(evt) {
            // deal with the first button being the
            // event.submitter when pressing enter
            if(evt.key === 'Enter') {
              evt.preventDefault()

              const event = new Event('submit', {
                bubbles: true, cancelable: true,
              })
              event.submitter = this
              form?.dispatchEvent(event)
              if(debug) console.debug({ Fired: event })
            }
          }}
        />
        {#if elements.length > 1}
          <nav>
            <button
              type="button"
							class="minus"
              onclick={() => elements.splice(idx, 1)}
              tabindex={-1}
            >−</button>
            {#if idx < elements.length - 1}
              <button
                type="button"
								class="slash"
                onclick={() => insertAt(idx)}
                tabindex={-1}
              >/</button>
            {/if}
          </nav>
        {/if}
      </li>
    {/each}
    <li><button id="more">+</button></li>
  </ol>
</form>

<style>
  ol {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    padding : 0;
    margin-inline-start: 2ch;
    gap: 1.5rem;
  }
  input {
    field-sizing: content;
    min-width: 3ch;
    padding-inline: 1ch 4ch;
  }
  .single input {
    padding-inline: 1ch;
  }
  li {
    position: relative;
    display: flex;
  }
  li nav {
    position: absolute;
    right: -1.5rem;
    top: 0.5rem;
    display: flex;
    gap: 0.25rem;
    align-content: flex-start;

    & button {
      padding: 0rem 0.5rem;
    }
  }
  #more, #before {
    right: 0ch;
    top: -0.5rem;
    padding: 0.5rem 0.75rem;
  }
  #before {
    right: auto;
    left: -3ch;
  }
	:is(#more, #before, .slash) {
		background-color: color-mix(in oklab, darkolivegreen 25%, #0008 60%);

		&:hover {
			background-color: color-mix(in oklab, magenta 25%, #FFF8 15%);
		}
	}
	:is(.minus) {
		background-color: color-mix(in oklab, darkorange 25%, #0008 60%);

    &:hover {
			background-color: color-mix(in oklab, red 50%, #FFF2 15%);
		}
	}
  :is(#clear) {
		background-color: color-mix(in oklab, darkcyan 25%, #0008 30%);

    &:hover {
			background-color: color-mix(in oklab, orange 50%, #FFF2 15%);
		}
  }
  button {
		border-radius: 0.5rem;
		transition: background-color 250ms;
  }
</style>