// import adapter from '@sveltejs/adapter-static'
// import adapter from '@sveltejs/adapter-node'
import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		// router: { type: 'hash' },
	},
}

export default config
