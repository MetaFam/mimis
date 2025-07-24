<script lang="ts">
  import type {
    Edge
  } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types'

  let { edge = 'top', gap = '0.5rem' }: {
    edge: Edge
    gap: string
  } = $props()

  const strokeSize = 2
  const terminalSize = 8
  const offsetToAlignTerminalWithLine = (
    (strokeSize - terminalSize) / 2
  )
  const lineOffset = `calc(-0.5 * (${gap} + ${strokeSize}px))`
</script>

<div
  style:--line-thickness={`${strokeSize}px`}
  style:--line-offset={lineOffset}
  style:--terminal-size={`${terminalSize}px`}
  style:--terminal-radius={`${terminalSize / 2}px`}
  style:--negative-terminal-size={`-${terminalSize}px`}
  style:--offset-terminal={`${offsetToAlignTerminalWithLine}px`}
  style:position="absolute"
  style:pointer-events="none"
  class={['drop-indicator', `${edge}`]}
></div>

<style>
  .drop-indicator {
    height: var(--line-thickness);
    left: var(--terminal-radius);
    right: 0;
    z-index: 10;

    &::before {
      content: '';
      position: absolute;
      left: var(--negative-terminal-size);
      width: var(--terminal-size);
      height: var(--terminal-size);
      border-width: var(--line-thickness);
      border-style: solid;
      border-radius: 50%;
    }

    &.top {
      top: var(--line-offset);
      &::before {
        top: var(--offset-terminal);
      }
    }
    &.bottom {
      bottom: var(--line-offset);
      &::before {
        bottom: var(--offset-terminal);
      }
    }
  }
</style>