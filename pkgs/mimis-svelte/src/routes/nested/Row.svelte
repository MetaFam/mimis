<script lang="ts">
  import Line from './Line.svelte'
  let { datum = $bindable({ id: null }) } = $props()
</script>

<Line bind:datum/>
