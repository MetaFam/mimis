<script lang="ts">
  import { settings } from '$lib/settings.svelte'
  import { type HTMLAttributes } from 'svelte/elements'

  let {
    elements = $bindable([''])
  }: {
    elements: Array<string>
  } = $props()
  let history = $state<Array<Array<string>>>([])
  let newIdx = $state<number | null>(null)
  let { debugging: debug } = settings
  let form = $state<HTMLFormElement | null>(null)
  let previous = $state<string | null>(null)

  function insertAt(idx: number, { clear = false } = {}) {
    const pre = clear ? [] : elements.slice(0, idx)
    const post = clear ? [] : elements.slice(idx)
    const out = [...pre, '', ...post]
    history.push([...elements])
    if(debug) console.debug({
      Replacing: history.at(-1), With: [...out],
    })
    elements = out
    newIdx = idx
  }

  function undo() {
    if(debug) console.debug({
      'Replacing From': [...history]
    })
    if(history.length > 0) {
      elements = history.pop() ?? ['']
    }
  }

  $effect(() => {
    if(newIdx != null) {
      (
        form
        ?.querySelectorAll('input')
        [newIdx] as HTMLElement
      )
      ?.focus()

      newIdx = null
    }
  })
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
      const shifted = Number(id) + 1
      if(debug) console.debug({ 'Inserting At': shifted })
      insertAt(shifted)
    } else if(['before', 'more'].includes(submitter)) {
      const idx = submitter === 'before' ? 0 : elements.length
      if(debug) console.debug({ idx })
      insertAt(idx)
    } else if(submitter === 'clear') {
      insertAt(0, { clear: true })
    } else {
      throw new Error(`Unrecognized Submitter Id: "${submitter}"`)
    }
  }}
>
  <ol>
    {#if elements.length > 1 || elements[0] !== ''}
      <li><button id="clear"><span>∅</span></button></li>
    {/if}
    <li><button id="before"><span>+</span></button></li>
    {#each elements as _elem, idx}
      <li class:single={elements.length <= 1}>
        <input
          id="text-{idx}"
          bind:value={elements[idx]}
          onkeydown={function(evt) {
            // deal with the first button being the
            // event.submitter when pressing enter
            if(evt.key === 'Enter') {
              evt.preventDefault()

              const event = new Event('submit', {
                bubbles: true, cancelable: true,
              })
              ;(
                event as
                unknown as
                { submitter: HTMLAttributes<HTMLInputElement> }
              ).submitter = this
              form?.dispatchEvent(event)
              if(debug) console.debug({ Fired: event })
            }
          }}
          onfocus={() => {
            previous = elements[idx]
          }}
          onblur={() => {
            if(previous && previous !== elements[idx]) {
              if(debug) console.debug({
                from: previous, to: elements[idx],
              })
              history.push([...elements])
            }
          }}
        />
        {#if elements.length > 1}
          <nav>
            <button
              type="button"
							class="minus"
              onclick={() => {
                history.push([...elements])
                elements.splice(idx, 1)
              }}
              tabindex={-1}
            ><span>−</span></button>
            {#if idx < elements.length - 1}
              <button
                type="button"
								class="slash"
                onclick={() => insertAt(idx + 1)}
                tabindex={-1}
              ><span>/</span></button>
            {/if}
          </nav>
        {/if}
      </li>
    {/each}
    <li><button id="more"><span>+</span></button></li>
    {#if history.length > 0}
      <li><button
        type="button"
        onclick={undo}
      ><span>↺</span></button></li>
    {/if}
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
  }
  #more, #before {
    right: 0ch;
    top: -0.5rem;
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
		transition: background-color 250ms;
  }
</style>