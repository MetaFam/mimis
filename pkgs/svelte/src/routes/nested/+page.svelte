<script lang="ts">
  import List from './List.svelte'

  type Datum = {
    id?: number
    title: string
  }

  let entries = $state<Array<Datum>>([
    { title: 'One' },
    { title: 'Two' },
    { title: 'Three' },
  ])

  let count = 0
  function identify (objArray: Array<Record<string, unknown>>) {
    return objArray.map((obj) => ({ id: ++count, ...obj })) as Array<Datum>
  }
  // svelte-ignore state_referenced_locally
  entries = identify(entries)
</script>

<main>
  <List bind:data={entries}/>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    min-height: 100dvh;
  }
</style>