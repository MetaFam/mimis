<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="well.svg"/>
</svelte:head>

<section class="app">
	<Header/>

	{@render children()}

	<footer></footer>
</section>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
