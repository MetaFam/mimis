<script lang="ts">
	import favicon from '#assets/logo.svg'
	import './app.css'

	let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
