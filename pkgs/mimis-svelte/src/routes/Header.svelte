<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
</script>

<header>
	<div class="corner">
		<a href="https://svelte.dev/docs/kit">
			<img src={logo} alt="SvelteKit" />
		</a>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={['', '#/'].includes(page.url.hash) ? 'page' : undefined}>
				<a href="/" id="home">🏡︎</a>
				<dialog open>Home</dialog>
			</li>
			<li aria-current={page.url.hash.startsWith('#/spider') ? 'page' : undefined}>
				<a href="/#/spider">🕷</a>
				<dialog open>Spider</dialog>
			</li>
			<li aria-current={page.url.hash.startsWith('#/upload') ? 'page' : undefined}>
				<a href="/#/upload">⇭</a>
				<dialog open>Upload</dialog>
			</li>
			<li aria-current={page.url.hash.startsWith('#/search') ? 'page' : undefined}>
				<a href="/#/browse">📖&#xFE0E;</a>
				<dialog open>Browse</dialog>
			</li>
			<li aria-current={page.url.hash.startsWith('#/list') ? 'page' : undefined}>
				<a href="/#/list">𝍤</a>
				<dialog open>List</dialog>
			</li>
			<li aria-current={page.url.hash === '#/about' ? 'page' : undefined}>
				<a href="/#/about">🛈</a>
				<dialog open>About</dialog>
			</li>
			<li aria-current={page.url.hash.startsWith('#/settings') ? 'page' : undefined}>
				<a href="/#/settings">⚙</a>
				<dialog open>Settings</dialog>
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<a href="https://github.com/dysbulic/mimis/">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.corner {
		width: 3em;
		height: 3em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: light-dark(#FFFA, #000A);

		& li a {
			anchor-name: --nav-link;
		}

		& li dialog {
			opacity: 0;
			position: absolute;
			position-anchor: --nav-link;
			top: calc(anchor(--nav-link bottom) + 0.5rem);
			padding: 0.25rem;
			border: none;
			pointer-events: none;
			transition: opacity 0.2s ease-in-out;
		}

		& li:hover dialog {
			opacity: 1;
			transition: opacity 0.5s ease-in-out;
		}
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
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
		transition: color 0.2s linear, font-size 0.1s ease-in-out;
	}

	a:hover {
		color: var(--color-theme-1);
		font-size: 1.75rem;
	}
</style>
