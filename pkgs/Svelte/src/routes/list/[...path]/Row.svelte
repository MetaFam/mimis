<script lang="ts" module>
  type DragState = (
    {
      type: 'idle'
    } | {
      type: 'preview'
      container: HTMLElement
    } | {
      type: 'is-dragging'
    } | {
      type: 'is-dragging-over'
      closestEdge: Edge | null
    }
  )
  export type DragStateType = DragState['type']
</script>

<script lang="ts" generics="R extends Record<string | symbol, unknown>">
  import {
    draggable,
    dropTargetForElements,
  } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
  import {
    setCustomNativeDragPreview
  } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
  import {
    pointerOutsideOfPreview
  } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
  import {
    combine
  } from '@atlaskit/pragmatic-drag-and-drop/combine'
  import invariant from 'tiny-invariant'
  import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
  } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
  import { mount, type Component, type MountOptions, type Snippet } from 'svelte'
  import DropIndicator from './DropIndicator.svelte'
  import context from './context.svelte'
  import Line from './Line.svelte'
  import Preview from './Preview.svelte'

  const { debug } = context
  const idle: DragState = { type: 'idle' }

  let {
    datum = $bindable(null), isDatum,
    rowClasses, index,
  }: {
    datum: { id: number } & unknown | null
    isDatum: (datum: unknown) => datum is R
    rowClasses?: (type: DragStateType) => string | Array<string>
    index: number
  } = $props()

  if(datum == null) throw new Error('`null` `datum`.')

  let item = $state<HTMLLIElement | null>(null)
  let status = $state<DragState>(idle)
  let open = $state(false)

  $effect(() => {
    invariant(item)
    return combine(
      draggable({
        element: item,
        getInitialData() {
          return datum as Record<string, unknown>
        },
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: pointerOutsideOfPreview({
              x: '1rem',
              y: '0.5rem',
            }),
            render({ container }) {
              if(Preview == null) return
              status = { type: 'preview', container }
              mount(Preview, {
                target: container,
                props: { datum },
              } as unknown as MountOptions<R>)
            },
          })
        },
        onDragStart() {
          status = { type: 'is-dragging' }
        },
        onDrop() {
          status = idle
        },
      }),
      dropTargetForElements({
        element: item,
        canDrop({ source }) {
          if(source.element === item) {
            return false // no drop on self
          }
          return isDatum(source.data)
        },
        getData({ input }) {
          if(datum == null) return {} // not quite right
          if(item == null) return datum
          return attachClosestEdge(datum, {
            element: item,
            input,
            allowedEdges: ['top', 'bottom'],
          })
        },
        getIsSticky() {
          return true
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data)
          status = { type: 'is-dragging-over', closestEdge }
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data)
          status = { type: 'is-dragging-over', closestEdge }
        },
        onDragLeave() {
          status = idle
        },
        onDrop() {
          status = idle
        },
      }),
    )
  })

  const setId = () => { context.activeId = datum?.id ?? null }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<li
  data-element-id={datum?.id}
  bind:this={item}
  class={rowClasses?.(status.type)}
  style:view-transition-name={`item-${datum?.id}`}
  onfocusin={setId}
  onkeypress={() => {}}
  onclick={(evt) => {
    setId()
    if(!context.any('isEditing')) {
      context.retrieve('focus', { useActive: true })()
      if(!evt.ctrlKey || !open) {
        context.retrieve('toggleOpen', { useActive: true })()
      }
    }
  }}
>
  <Line bind:datum bind:open {index}/>
  {#if status.type === 'is-dragging-over' && status.closestEdge}
    <DropIndicator edge={status.closestEdge} gap={'0.5rem'}/>
  {/if}
</li>

<style>
  li {
    cursor: pointer;
  }
</style>