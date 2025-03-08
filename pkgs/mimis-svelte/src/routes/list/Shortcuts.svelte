<script lang="ts">
  let { handle = $bindable<HTMLDialogElement | null>(null) } = $props()
</script>

<dialog bind:this={handle}>
  <h1>Keyboard Shortcuts</h1>

  <form method="dialog">
    <button id="close">⨯</button>

    <ul>
      <li><kbd>e</kbd>: Edit the title of the highlighted entry.</li>
      <li><kbd>j</kbd>: Jump to a specific entry number.</li>
      <li><kbd>a</kbd>: Add files into the list.</li>
      <li><kbd>v</kbd>: View all entries.</li>
      <li><kbd>h</kbd>: Hide all entries.</li>
      <li><kbd>u</kbd>: Undo the last change.</li>
      <li>
        <kbd>z</kbd>: Zoom in on the highlighted entry:
        <ul>
          <li><kbd>escape</kbd> / <kbd>z</kbd>: Zoom out.</li>
          <li><kbd>→</kbd> / <kbd>↓</kbd>: Next entry.</li>
          <li><kbd>←</kbd> / <kbd>↑</kbd>: Previous entry.</li>
          <li><kbd>space</kbd>: Play / pause media.</li>
          <li><kbd>m</kbd>: Mute / unmute media.</li>
        </ul>
      </li>
      <li><kbd>?</kbd>: Display / hide these shortcuts.</li>
      <li><kbd><i>enter</i></kbd>: Expand / collapse the highlighted entry.</li>
      <li>
        <kbd><i>space</i></kbd>:
        <ul>
          <li>If the highlighted entry is collapsed, expand it.</li>
          <li>If the expanded entry is media, play / pause it.</li>
        </ul>
      </li>
      <li><kbd>↑ / ↓</kbd>: Highlight the previous / next entry.</li>
    </ul>

    <ul id="controls">
      <li><button id="ok">OK</button></li>
    </ul>
  </form>
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

  #controls {
    display: flex;
    list-style: none;
    justify-content: flex-end;
    margin-inline-end: 5rem;
  }
</style>