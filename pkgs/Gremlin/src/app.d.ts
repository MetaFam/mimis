// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			address?: string
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				NONCES: KVNamespace
			}
		}
	}

	interface Window {
		showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>
	}
}

export {}
