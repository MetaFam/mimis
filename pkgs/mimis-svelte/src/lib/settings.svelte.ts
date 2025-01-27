import {
  PUBLIC_IPFS_PATTERN as pattern,
  PUBLIC_IPFS_API as api,
  PUBLIC_NEO4J_URI as uri,
  PUBLIC_NEO4J_USER as user,
  PUBLIC_NEO4J_PASSWORD as pass,
  PUBLIC_LIMIT as limit,
} from '$env/static/public'

class Settings {
  static keys = {
    ipfsPattern: 'mimis-setting-ipfs-pattern',
    ipfsAPI: 'mimis-setting-ipfs-api',
    neo4jURL: 'mimis-setting-neo4j-url',
    neo4jUser: 'mimis-setting-neo4j-user',
    neo4jPass: 'mimis-setting-neo4j-pass',
    limit: 'mimis-setting-limit',
  } as const
  static defaults = {
    [Settings.keys.ipfsPattern]: (
      pattern || 'http://localhost:8080/ipfs/{cid}{path}'
    ),
    [Settings.keys.ipfsAPI]: (
      api || 'http://localhost:5001/api/v0'
    ),
    [Settings.keys.neo4jURL]: uri || 'bolt://localhost:7687',
    [Settings.keys.neo4jUser]: user || 'neo4j',
    [Settings.keys.neo4jPass]: pass || 'neo4j',
    [Settings.keys.limit]: limit || 125,
  }

  valueOf(key: Omit<keyof typeof Settings.keys, 'limit'>): string
  valueOf(key: 'limit'): number
  valueOf(key: keyof typeof Settings.keys) {
    return (
      typeof localStorage === 'undefined' ? (
        Settings.defaults[Settings.keys[key]]
      ) : (
        (() => {
          let value = (
            localStorage.getItem(Settings.keys[key])
          )
          let defaultVal = Settings.defaults[
            Settings.keys[key]
          ]
          if(value) {
            if(typeof defaultVal === 'string') {
              return value
            } else {
              return Number(value)
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
