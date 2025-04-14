<script lang="ts">
  let {
    log = $bindable<Array<string>>([]),
    active = $bindable<boolean>(false),
  } = $props()
</script>

<ul>
  {#each log as line}
    <li>
      {line}
    </li>
  {/each}
</ul>

