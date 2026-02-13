import { browser } from '$app/environment'
import { page } from '$app/state'
import { env } from '$env/dynamic/public'

export class Settings {
  static keys = {
    ipfsURLPattern: 'mimis-setting-ipfs-url-pattern',
    ipfsAPI: 'mimis-setting-ipfs-api',
    neo4jURL: 'mimis-setting-neo4j-url',
    neo4jUser: 'mimis-setting-neo4j-user',
    neo4jPass: 'mimis-setting-neo4j-pass',
    limit: 'mimis-setting-limit',
    debugging: 'mimis-setting-debugging',
    useKubo: 'mimis-setting-use-kubo',
    kuboUsername: 'mimis-setting-kubo-username',
    kuboPassword: 'mimis-setting-kubo-password',
    useStoracha: 'mimis-setting-use-storacha',
    storachaEmail: 'mimis-setting-storacha-email',
    storachaSpace: 'mimis-setting-storacha-space',
    detailsZoom: 'mimis-setting-details-zoom',
    janusGraphURL: 'mimis-setting-janusgraph-url',
    janusGraphUsername: 'mimis-setting-janusgraph-username',
    janusGraphPassword: 'mimis-setting-janusgraph-password',
    publicJanusGraphURL: 'mimis-setting-public-janusgraph-url',
  } as const
  static defaults = {
    [Settings.keys.ipfsURLPattern]: (
      env.PUBLIC_IPFS_URL_PATTERN || 'http://{cid}.ipfs.localhost:8080{path}'
    ),
    [Settings.keys.ipfsAPI]: (
      env.PUBLIC_IPFS_API || 'http://localhost:5001/api/v0'
    ),
    [Settings.keys.neo4jURL]: env.PUBLIC_NEO4J_URI || 'bolt://localhost:7687',
    [Settings.keys.neo4jUser]: env.PUBLIC_NEO4J_USER || 'neo4j',
    [Settings.keys.neo4jPass]: env.PUBLIC_NEO4J_PASS || 'neo4j',
    [Settings.keys.limit]: env.PUBLIC_LIMIT ? Number(env.PUBLIC_LIMIT) : 125,
    [Settings.keys.debugging]: (
      browser && page.url.searchParams.has('debug') ? (
        true
      ) : (
        env.PUBLIC_DEBUGGING ? Boolean(env.PUBLIC_DEBUGGING) : false
      )
    ),
    [Settings.keys.useKubo]: (
      env.PUBLIC_USE_KUBO ? Boolean(env.PUBLIC_USE_KUBO) : true
    ),
    [Settings.keys.kuboUsername]: '',
    [Settings.keys.kuboPassword]: '',
    [Settings.keys.useStoracha]: (
      env.PUBLIC_USE_STORACHA ? Boolean(env.PUBLIC_USE_STORACHA) : false
    ),
    [Settings.keys.storachaEmail]: '',
    [Settings.keys.storachaSpace]: 'Mïmis',
    [Settings.keys.detailsZoom]: (
      env.PUBLIC_DETAILS_ZOOM ? Number(env.PUBLIC_DETAILS_ZOOM) : 1
    ),
    [Settings.keys.janusGraphURL]: (
      env.PUBLIC_JANUSGRAPH_URL || 'ws://localhost:8182/gremlin'
    ),
    [Settings.keys.janusGraphUsername]: (
      env.PUBLIC_JANUSGRAPH_USERNAME || 'mimis'
    ),
    [Settings.keys.janusGraphPassword]: (
      env.PUBLIC_JANUSGRAPH_PASSWORD || 'ThisistheJanusGraphpasswordformimis.'
    ),
    [Settings.keys.publicJanusGraphURL]: (
      env.PUBLIC_PUBLIC_JANUSGRAPH_URL || 'ws://janus.mimis.dhappy.org:8182/gremlin'
    ),
  }

  constructor(args?: Record<keyof typeof Settings.keys, unknown>) {
    Object.entries(args ?? {}).forEach(([key, val]) => {
      switch(key) {
        case 'debugging': {
          this.debugging = Boolean(val)
          break
        }
        case 'useKubo': {
          this.useKubo = Boolean(val)
          break
        }
        case 'useStoracha': {
          this.useStoracha = Boolean(val)
          break
        }
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          (Object.keys(Settings.keys).includes(key)) ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any)[key as keyof typeof Settings.keys] = val
          ) : (
            console.warn(`Unhanded constructor argument: "${key}".`)
          )
        }
      }
    })
  }

  valueOf(key: Omit<keyof typeof Settings.keys, 'limit' | 'debugging' | 'useStoracha' | 'useKubo'>): string
  valueOf(key: 'limit' | 'detailsZoom'): number
  valueOf(key: 'debugging' | 'useStoracha' | 'useKubo'): boolean
  valueOf(key: keyof typeof Settings.keys) {
    const defaultVal = Settings.defaults[Settings.keys[key]]
    const value = (typeof localStorage !== 'undefined') ? (
      localStorage.getItem(Settings.keys[key])
    ) : defaultVal
    if(value != null) {
      if(typeof defaultVal === 'number') {
        return Number(value)
      } else if(typeof defaultVal === 'boolean') {
        return Boolean(value)
      } else {
        return value
      }
    } else {
      return defaultVal
    }
  }

  get values() {
    return new Settings(this)
  }
  set values(settings: Settings) {
    for(const key of Object.keys(Settings.keys)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)[key as keyof typeof Settings.keys] = (
        settings[key as keyof typeof Settings.keys]
      )
    }
  }

  ipfsAPI = $state(this.valueOf('ipfsAPI'))
  ipfsURLPattern = $state(this.valueOf('ipfsURLPattern'))
  neo4jURL = $state(this.valueOf('neo4jURL'))
  neo4jUser = $state(this.valueOf('neo4jUser'))
  neo4jPass = $state(this.valueOf('neo4jPass'))
  limit = $state(this.valueOf('limit'))
  debugging = $state(Boolean(this.valueOf('debugging')))
  useKubo = $state(Boolean(this.valueOf('useKubo')))
  kuboUsername = $state(this.valueOf('kuboUsername'))
  kuboPassword = $state(this.valueOf('kuboPassword'))
  useStoracha = $state(Boolean(this.valueOf('useStoracha')))
  storachaEmail = $state(this.valueOf('storachaEmail'))
  storachaSpace = $state(this.valueOf('storachaSpace'))
  detailsZoom = $state(this.valueOf('detailsZoom'))
  janusGraphURL = $state(this.valueOf('janusGraphURL'))
  janusGraphUsername = $state(this.valueOf('janusGraphUsername'))
  janusGraphPassword = $state(this.valueOf('janusGraphPassword'))
  publicJanusGraphURL = $state(this.valueOf('publicJanusGraphURL'))

  save(key?: keyof typeof Settings.keys) {
    if(typeof localStorage !== 'undefined') {
      if(key != null) {
        if(this[key] == null || this[key] === '') {
          localStorage.removeItem(Settings.keys[key])
        } else {
          localStorage.setItem(
            Settings.keys[key],
            String(this[key]),
          )
        }
      } else {
        for(
          const key of
          Object.keys(Settings.keys) as
          Array<keyof typeof Settings.keys>
        ) {
          this.save(key)
        }
      }
    }
  }
}

export const settings = new Settings()

export default settings
