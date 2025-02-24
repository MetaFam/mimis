<script lang="ts">
  let { handle = $bindable<HTMLDialogElement | null>(null) } = $props()
</script>

<dialog bind:this={handle}>
  <h1>Keyboard Shortcuts</h1>

  <form method="dialog">
    <button id="close">⨯</button>
  </form>

  <ul>
    <li><kbd>e</kbd>: Edit the title of the currently highlighted entry.</li>
    <li><kbd>j</kbd>: Jump to a specific entry number.</li>
    <li><kbd>a</kbd>: Add files into the list.</li>
    <li><kbd>u</kbd>: Undo the last change.</li>
    <li><kbd>z</kbd>: Zoom in / out on the highlighted entry.</li>
    <li><kbd>?</kbd>: Display / hide these shortcuts.</li>
    <li><kbd><i>enter</i></kbd>: Expand / collapse the highlighted entry.</li>
    <li>
      <kbd><i>space</i></kbd>:
      <ul>
        <li>If the highlighted entry is collapsed, expand it.</li>
        <li>If the highlighted entry is expanded & media, play / pause it.</li>
      </ul>
    </li>
    <li><kbd>↑ / ↓</kbd>: Highlight the previous / next entry.</li>
  </ul>
</dialog>

<style>
  ul {
    font-size: 1.5rem;
  }
  button#close {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    padding: 0.5rem;
    border-radius: 50%;
    border: none;
    background: none;
    color: light-dark(black, white);
    font-size: 1.5rem;
    cursor: pointer;
  }
</style>