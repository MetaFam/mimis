// SvelteKit’s page runtime defines this global, which `$app/env/public`
// reads; Vitest’s browser mode loads components without that runtime.
Object.assign(globalThis, { __sveltekit_dev: { env: {} } })
