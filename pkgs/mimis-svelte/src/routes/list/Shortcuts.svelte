<script lang="ts">
  let { handle = $bindable<HTMLDialogElement | null>(null) } = $props()
</script>

<dialog bind:this={handle}>
  <h1>Keyboard & Touch Navigation</h1>

  <form method="dialog">
    <button id="close">⨯</button>

    <ul>
      <li><kbd>?</kbd>: (Display|Hide) these shortcuts.</li>
      <li><kbd>↑</kbd> | <kbd>↓</kbd>: Highlight the (previous|next) entry.</li>
      <li><kbd>enter</kbd>: (Expand|Collapse) the highlighted entry.</li>
      <li><kbd>e</kbd>: Edit the title of the highlighted entry.</li>
      <li><kbd>c</kbd>: Copy the highlighted entry to a different list.</li>
      <li><kbd>x</kbd> / <kbd>delete</kbd> / <kbd>backspace</kbd>: Delete the highlighted entry.</li>
      <li><kbd>s</kbd> | <kbd>n</kbd>: (Save|Load) the current configuration (to|from) Neo4j.</li>
      <li><kbd>j</kbd>: Jump to a specific entry number.</li>
      <li><kbd>m</kbd>, (<kbd>↑</kbd> | <kbd>↓</kbd>), <kbd>enter</kbd>: Move the selected entry (up|down).</li>
      <li><kbd>d</kbd> | <kbd>l</kbd>: (Down)?Load the congfiguration as JSON5.</li>
      <li><kbd>p</kbd> | <kbd>b</kbd>: (Publish|Load) a CBOR representation of the list (to|from) IPFS pub/sub.</li>
      <li><kbd>a</kbd>: Add local files to the list <em>(removing duplicates)</em>.</li>
      <li><kbd>v</kbd>: View all entries.</li>
      <li><kbd>h</kbd>: Hide all entries.</li>
      <li><kbd>u</kbd> | <kbd>r</kbd>: (Un|Re)do the last change.</li>
      <li>
        <kbd><i>space</i></kbd>:
        <ul>
          <li>If the highlighted entry is collapsed, expand it.</li>
          <li>If the expanded entry is media, (play|pause) it.</li>
          <li>If the expanded entry is not media, collapse it.</li>
        </ul>
      </li>
      <li>
        <kbd>z</kbd>: Zoom in on the highlighted entry:
        <ul>
          <li><kbd>z</kbd> / <kbd>escape</kbd>: Zoom out.</li>
          <li><kbd>ctrl</kbd> ➕ <kbd>→</kbd> / <kbd>→</kbd> ⨯ 2 / <kbd>enter</kbd> / <em>swipe</em> <kbd>→</kbd>: View the next entry.</li>
          <li><kbd>ctrl</kbd> ➕ <kbd>←</kbd> / <kbd>←</kbd> ⨯ 2 / <em>swipe</em> <kbd>←</kbd>: View the previous entry.</li>
          <li>(<em>pan</em>)? <kbd>→</kbd> | (<em>pan</em>)? <kbd>←</kbd>: Seek (forward|back) by 2 seconds.</li>
          <li><kbd>→</kbd> ⨯ 2, <kbd>→</kbd>+ | <kbd>←</kbd> ⨯ 2, <kbd>→</kbd>+: Seek (forward|back) by 1 minute.</li>
          <li>(<kbd>→</kbd> | <kbd>←</kbd>) ≥ 2sec: Seek (forward|back) by 7½% for each additional 1½ second held.</li>
          <li><kbd>0</kbd>–<kbd>9</kbd>: Seek to 0–90% of the way through the media.</li>
          <li><kbd>↑</kbd> | <kbd>↓</kbd>: (In|De)crease the volume by ⅕.</li>
          <li><kbd>ctrl</kbd> ➕ (<kbd>↑</kbd> | <kbd>↓</kbd>) / (<em>pan</em>)? (<kbd>↑</kbd> | <kbd>↓</kbd>): (In|De)crease the volume by 75%.</li>
          <li><kbd>space</kbd>: (Play|Pause) media.</li>
          <li><kbd>m</kbd>: (Un)?Mute media.</li>
          <li><kbd>f</kbd>: Toggle fullscreen.</li>
        </ul>
      </li>
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