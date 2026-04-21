const devNonces = new Map<string, { value: string, expires: number }>()

export function getNonceStore(platform: App.Platform | undefined) {
  if(platform?.env?.NONCES) {
    return {
      async put(key: string, value: string, opts: { expirationTtl: number }) {
        await platform.env.NONCES.put(key, value, opts)
      },
      async get(key: string) {
        return platform.env.NONCES.get(key)
      },
      async delete(key: string) {
        await platform.env.NONCES.delete(key)
      },
    }
  }

  return {
    async put(key: string, value: string, opts: { expirationTtl: number }) {
      devNonces.set(key, {
        value,
        expires: Date.now() + opts.expirationTtl * 1000,
      })
    },
    async get(key: string) {
      const entry = devNonces.get(key)
      if(!entry) return null
      if(Date.now() > entry.expires) {
        devNonces.delete(key)
        return null
      }
      return entry.value
    },
    async delete(key: string) {
      devNonces.delete(key)
    },
  }
}