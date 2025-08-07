import { page } from '$app/state'
import { env } from '$env/dynamic/public'

class Settings {
  static keys = {
    ipfsPattern: 'mimis-setting-ipfs-pattern',
    ipfsAPI: 'mimis-setting-ipfs-api',
    neo4jURL: 'mimis-setting-neo4j-url',
    neo4jUser: 'mimis-setting-neo4j-user',
    neo4jPass: 'mimis-setting-neo4j-pass',
    limit: 'mimis-setting-limit',
    debugging: 'mimis-setting-debugging',
    ipfsProvider: 'mimis-setting-ipfs-provider',
    storachaEmail: 'mimis-setting-storacha-email',
  } as const
  static defaults = {
    [Settings.keys.ipfsPattern]: (
      env.PUBLIC_IPFS_PATTERN || 'http://localhost:8080/ipfs/{cid}{path}'
    ),
    [Settings.keys.ipfsAPI]: (
      env.PUBLIC_IPFS_API || 'http://localhost:5001/api/v0'
    ),
    [Settings.keys.neo4jURL]: env.PUBLIC_NEO4J_URI || 'bolt://localhost:7687',
    [Settings.keys.neo4jUser]: env.PUBLIC_NEO4J_USER || 'neo4j',
    [Settings.keys.neo4jPass]: env.PUBLIC_NEO4J_PASSWORD || 'neo4j',
    [Settings.keys.limit]: env.PUBLIC_LIMIT ? Number(env.PUBLIC_LIMIT) : 125,
    [Settings.keys.debugging]: page.url.searchParams.has('debug'),
    [Settings.keys.ipfsProvider]: 'local',
    [Settings.keys.storachaEmail]: '',
  }

  valueOf(key: Omit<keyof typeof Settings.keys, 'limit' | 'debugging'>): string
  valueOf(key: 'limit'): number
  valueOf(key: 'debugging'): boolean
  valueOf(key: keyof typeof Settings.keys) {
    return (
      typeof localStorage === 'undefined' ? (
        Settings.defaults[Settings.keys[key]]
      ) : (
        (() => {
          const value = (
            localStorage.getItem(Settings.keys[key])
          )
          const defaultVal = Settings.defaults[
            Settings.keys[key]
          ]
          if(value != null) {
            if(typeof defaultVal === 'number') {
              return Number(value)
            } else if(typeof defaultVal === 'boolean') {
              return Boolean(value)
            } else {
              return value
            }
          } else {
            localStorage.setItem(
              Settings.keys[key], String(defaultVal),
            )
            return defaultVal
          }
        })()
      )
    )
  }

  ipfsAPI = $state(this.valueOf('ipfsAPI'))
  ipfsPattern = $state(this.valueOf('ipfsPattern'))
  neo4jURL = $state(this.valueOf('neo4jURL'))
  neo4jUser = $state(this.valueOf('neo4jUser'))
  neo4jPass = $state(this.valueOf('neo4jPass'))
  limit = $state(this.valueOf('limit'))
  debugging = $state(this.valueOf('debugging'))
  ipfsProvider = $state(this.valueOf('ipfsProvider'))
  storachaEmail = $state(this.valueOf('storachaEmail'))

  get saveLocal() {
    return this.ipfsProvider === 'local'
  }

  save(key?: keyof typeof Settings.keys) {
    if(key != null) {
      if(this[key] == null || this[key] === '') {
        if(typeof localStorage !== 'undefined') {
          localStorage.removeItem(Settings.keys[key])
        }
      } else {
        localStorage.setItem(
          Settings.keys[key],
          String(this[key]),
        )
      }
    } else if(key == null) {
      for(
        const key of
        Object.keys(Settings.keys) as
        Array<keyof typeof Settings.keys>
      ) {
        this.save(key)
      }
    } else {
      console.error(`Unknown Key: ${key}`)
    }
  }
}

export const settings = new Settings()
