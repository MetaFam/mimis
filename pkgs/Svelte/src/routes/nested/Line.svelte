<script lang="ts">
	let {
		datum = $bindable({ id: null, title: 'Default' }),
	} = $props()
	let editing = $state(false)
</script>

<form onsubmit={(evt) => {
	evt.preventDefault()
	editing = !editing
}}>
	{#if !editing}
		<button>✒️ {datum.title} ({datum.id})</button>
	{:else}
		<input bind:value={datum.title}/>
	{/if}
</form>