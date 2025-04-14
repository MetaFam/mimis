<script lang="ts" generics="D extends Record<string | symbol, unknown> & { id: number }">
  import {
    monitorForElements
  } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
  import {
    extractClosestEdge
  } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
  import {
    reorderWithEdge
  } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
  import {
    triggerPostMoveFlash
  } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash'
  import { tick, type Component, type Snippet } from 'svelte'
  import Row, { type DragStateType } from './Row.svelte'

  let {
    data = $bindable([]),
    history = $bindable([]),
    isDatum: externalIsDatum,
    listClasses,
    row,
    rowClasses,
    preview,
  }: {
    data: Array<D>
    history?: Array<Array<D>>
    isDatum?: (datum: unknown) => datum is D
    listClasses?: string | Array<string>
    row: Component
    rowClasses?: (type: DragStateType) => string | Array<string>
    preview: Component
  } = $props()

  let list = $state<HTMLElement | null>(null)

  const isDatum = (datum: unknown): datum is D => (
    externalIsDatum ? externalIsDatum(datum) : true
  )

  $effect(() => (
    monitorForElements({
      canMonitor({ source }) {
        return isDatum(source.data)
      },
      onDrop({ location, source }) {
        const [target] = location.current.dropTargets
        if(!target) return

        const { data: sourceData } = source
        const { data: targetData } = target

        if(!isDatum(sourceData) || !isDatum(targetData)) {
          return
        }

        const indexOfDatum = (id: number) => (
          data.findIndex(({ id: current }) => current === id)
        )
        const indexOfSource = indexOfDatum(sourceData.id)
        const indexOfTarget = indexOfDatum(targetData.id)

        if(indexOfTarget < 0 || indexOfSource < 0) {
          return
        }

        const closestEdgeOfTarget = (
          extractClosestEdge(targetData)
        )

        type ColorPair = {
          color?: string
          elem?: HTMLElement
          idx: number
        }

        const transition = async () => {
          history.push([...data])
          const from: ColorPair = { idx: indexOfSource }
          const to: ColorPair = { idx: indexOfTarget }
          if(list) {
            for(const set of [from, to]) {
              set.elem = list?.querySelector(
                `li:nth-of-type(${set.idx + 1})`
              ) as HTMLElement
              set.color = getComputedStyle(set.elem).borderColor
            }
            if(from.elem && from.color && to.elem && to.color) {
              from.elem.style.borderColor = from.color
              to.elem.style.borderColor = to.color
            }
          }

          data = reorderWithEdge({
            list: data,
            startIndex: indexOfSource,
            indexOfTarget,
            closestEdgeOfTarget,
            axis: 'vertical',
          })

          await tick()

          if(from.elem && from.color && to.elem && to.color) {
            from.elem.style.borderColor = to.color
            to.elem.style.borderColor = from.color
          }
        }

        if('startViewTransition' in document) {
          document.startViewTransition(transition)
        } else {
          transition()
        }

        const element = document.querySelector(
          `[data-element-id="${sourceData.id}"]`
        )
        if(element instanceof HTMLElement) {
          triggerPostMoveFlash(element)
        }
      },
    })
  ))
</script>

<ol
  bind:this={list}
  class={[...Array.from(listClasses ?? []), 'sortable-list']}
>
  {#each data as datum, index (datum.id)}
    <Row
      {row} {rowClasses}
      {preview}
      {isDatum} bind:datum={data[index]}
      {index}
    />
  {/each}
</ol>
