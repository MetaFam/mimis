<script lang="ts">
	import { page } from '$app/state'
	import logo from '$lib/images/svelte-logo.svg'
	import { afterNavigate } from '$app/navigation'
  import GitHub from '$lib/images/github.svg?raw'

	type Page = {
		url: string
		icon: string
		title: string
	}

	const pages = [
		{ url: '#/', icon: '🏡', title: 'Home' },
		{ url: '#/spider', icon: '🕷️', title: 'Spider' },
		{ url: '#/upload', icon: '⏫', title: 'Upload' },
		{ url: '#/browse', icon: '📖️', title: 'Browse' },
		{ url: '#/list', icon: '📋', title: 'List' },
		{ url: '#/post', icon: '📫️', title: 'Post' },
		{ url: '#/flow', icon: '🌊', title: 'Flow' },
		{ url: '#/publish', icon: '☢️', title: 'Publish' },
		{ url: '#/about', icon: 'ℹ️', title: 'About' },
		{ url: '#/settings', icon: '⚙️', title: 'Settings' },
	]
	let currentPage: Page | null = $state(null)
	function localize() {
		currentPage = (
			pages.findLast((pg) => page.url.hash.startsWith(pg.url))
			?? pages[0]
		)
	}
	afterNavigate(localize)
</script>

<header>
	<div class="left corner">
		<a href="https://svelte.dev/docs/kit">
			<img src={logo} alt="SvelteKit" />
		</a>
		<a
			href="https://github.com/dysbulic/mimis/"
			style:color="cornflower"
			style:--hover-stroke-1="color-mix(in oklab, yellow, transparent)"
			style:--hover-stroke-2="color-mix(in oklab, white 80%, transparent 25%)"
		>
			{@html GitHub}
		</a>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			{#each pages as page}
				<li aria-current={currentPage?.title === page.title && 'page'}>
					<a href={page.url}>{page.icon}</a>
					<dialog open>{page.title}</dialog>
				</li>
			{/each}
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.left.corner {
		width: 3em;
		height: 3em;
		display: flex;

		& a {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			transition: scale 0.25s ease-in-out;
		}

	  & :is(img, :global(svg)) {
			width: 4em;
			height: 4em;
			object-fit: contain;
			transition: translate 0.25s ease-in-out, color 0.1s linear;

			&:hover {
				color: green;
				translate: 0.5rem 0.5rem;
			}
		}
	}

	nav {
		display: flex;
		flex-grow: 1;
		justify-content: center;
		--background: light-dark(#FFFA, #000A);

		& li dialog {
			opacity: 0;
			position: absolute;
			padding: 0.25rem;
			border: none;
			pointer-events: none;
			transition: opacity 0.2s ease-in-out;
		}

		& li:hover dialog {
			opacity: 1;
			transition: opacity 0.5s ease-in-out;
		}

		& svg {
			width: 2em;
			height: 3em;
			display: block;

			& path {
				fill: var(--background);
			}
		}
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']	a {
		color: green;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 1.25rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear, scale 0.1s ease-in-out;
	}

	a:hover {
		color: var(--color-theme-1);
		scale: 2;
	}
</style>
