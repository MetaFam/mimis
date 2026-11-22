import { browser } from '$app/env'
import { page } from '$app/state'
import {
  PUBLIC_IPFS_URL_PATTERN,
  PUBLIC_IPFS_API,
  PUBLIC_IPFS_TIMEOUT,
  PUBLIC_NEO4J_URI,
  PUBLIC_NEO4J_USER,
  PUBLIC_NEO4J_PASS,
  PUBLIC_LIMIT,
  PUBLIC_DEBUGGING,
  PUBLIC_USE_KUBO,
  PUBLIC_USE_STORACHA,
  PUBLIC_DETAILS_ZOOM,
  PUBLIC_JANUSGRAPH_URL,
  PUBLIC_JANUSGRAPH_USERNAME,
  PUBLIC_JANUSGRAPH_PASSWORD,
  PUBLIC_PUBLIC_JANUSGRAPH_URL,
  PUBLIC_EDITOR_URL,
} from '$app/env/public'

export type DetailsView = 'icons' | 'table'

export class Settings {
  static keys = {
    ipfsURLPattern: 'mimis-setting-ipfs-url-pattern',
    ipfsAPI: 'mimis-setting-ipfs-api',
    ipfsTimeout: 'mimis-setting-ipfs-timeout',
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
    detailsView: 'mimis-setting-details-view',
    janusGraphURL: 'mimis-setting-janusgraph-url',
    janusGraphUsername: 'mimis-setting-janusgraph-username',
    janusGraphPassword: 'mimis-setting-janusgraph-password',
    publicJanusGraphURL: 'mimis-setting-public-janusgraph-url',
    editorURL: 'mimis-setting-editor-url',
  } as const
  static defaults = {
    [Settings.keys.ipfsURLPattern]: (
      PUBLIC_IPFS_URL_PATTERN || 'http://{cid}.ipfs.localhost:8080{path}'
    ),
    [Settings.keys.ipfsAPI]: (
      PUBLIC_IPFS_API || 'http://localhost:5001/api/v0'
    ),
    [Settings.keys.ipfsTimeout]: (
      PUBLIC_IPFS_TIMEOUT ? Number(PUBLIC_IPFS_TIMEOUT) : 45_000
    ),
    [Settings.keys.neo4jURL]: PUBLIC_NEO4J_URI || 'bolt://localhost:7687',
    [Settings.keys.neo4jUser]: PUBLIC_NEO4J_USER || 'neo4j',
    [Settings.keys.neo4jPass]: PUBLIC_NEO4J_PASS || 'neo4j',
    [Settings.keys.limit]: PUBLIC_LIMIT ? Number(PUBLIC_LIMIT) : 125,
    [Settings.keys.debugging]: (
      browser && page.url.searchParams.has('debug') ? (
        true
      ) : (
        PUBLIC_DEBUGGING ? Boolean(PUBLIC_DEBUGGING) : false
      )
    ),
    [Settings.keys.useKubo]: (
      PUBLIC_USE_KUBO ? Boolean(PUBLIC_USE_KUBO) : true
    ),
    [Settings.keys.kuboUsername]: '',
    [Settings.keys.kuboPassword]: '',
    [Settings.keys.useStoracha]: (
      PUBLIC_USE_STORACHA ? Boolean(PUBLIC_USE_STORACHA) : false
    ),
    [Settings.keys.storachaEmail]: '',
    [Settings.keys.storachaSpace]: 'Mïmis',
    [Settings.keys.detailsZoom]: (
      PUBLIC_DETAILS_ZOOM ? Number(PUBLIC_DETAILS_ZOOM) : 1
    ),
    [Settings.keys.detailsView]: 'icons',
    [Settings.keys.janusGraphURL]: (
      PUBLIC_JANUSGRAPH_URL || 'wss://janus.mimis.dhappy.org/gremlin'
    ),
    [Settings.keys.janusGraphUsername]: (
      PUBLIC_JANUSGRAPH_USERNAME || 'mimis'
    ),
    [Settings.keys.janusGraphPassword]: (
      PUBLIC_JANUSGRAPH_PASSWORD || 'This is the JanusGraph password for mimis.'
    ),
    [Settings.keys.publicJanusGraphURL]: (
      PUBLIC_PUBLIC_JANUSGRAPH_URL || 'wss://janus.mimis.dhappy.org/gremlin'
    ),
    [Settings.keys.editorURL]: (
      PUBLIC_EDITOR_URL || 'http://localhost:33333'
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
  valueOf(key: 'limit' | 'detailsZoom' | 'ipfsTimeout'): number
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
  ipfsTimeout = $state(this.valueOf('ipfsTimeout'))
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
  /** Whether a folder’s entries show as `icons` or as a `table`. */
  detailsView = $state(this.valueOf('detailsView') as DetailsView)
  janusGraphURL = $state(this.valueOf('janusGraphURL'))
  janusGraphUsername = $state(this.valueOf('janusGraphUsername'))
  janusGraphPassword = $state(this.valueOf('janusGraphPassword'))
  publicJanusGraphURL = $state(this.valueOf('publicJanusGraphURL'))
  editorURL = $state(this.valueOf('editorURL'))

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
