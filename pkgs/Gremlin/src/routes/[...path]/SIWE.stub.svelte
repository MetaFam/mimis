<script module lang="ts">
  export const session: { me: string | null } = { me: '0xabc' }
</script>

<script lang="ts">
  let { me = $bindable<string | null>(null) } = $props()
  me = session.me
</script>
