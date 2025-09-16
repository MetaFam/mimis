import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
// import mkcert from 'vite-plugin-mkcert'
// import openIde from 'vite-inspector'

export default defineConfig({
	plugins: [
		// mkcert(),
		// openIde({ framework: 'svelte' }),
		sveltekit(),
	],
})
