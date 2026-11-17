<script lang="ts">
  let { me = $bindable<string | null>(null) } = $props()
  me = '0xabc'
</script>
