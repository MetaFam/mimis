import { error, isHttpError } from '@sveltejs/kit'

/** An `HttpError` as it is, & anything else as a 500 naming `name`. */
export function rethrow(name: string, err: unknown): never {
  if(isHttpError(err)) throw err
  console.error({ [name]: err })
  throw error(500, `${name}: "${(err as Error)?.message ?? err}"`)
}
