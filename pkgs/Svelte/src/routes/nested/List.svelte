<script lang="ts">
  import Row from './Row.svelte'
  let { data = $bindable([]) } = $props()
</script>

<ul>
  {#each data as _datum, index}
    <li><Row bind:datum={data[index]}/></li>
  {/each}
</ul>