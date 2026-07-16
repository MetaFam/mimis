#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import {
  connect,
  generateKey,
  addressOf,
  isAddress,
  CID,
  type Address,
  type GraniteConfig,
  type Granite,
  type Mount,
  type Tree,
} from './index.ts'
import { MissingKeyError, UnreachableNodeError } from './errors.ts'
import { kuboStore } from './store.ts'
import { ethereumRegistry } from './registry.ts'
import { kuboClient } from './files.ts'
import {
  applyPatterns,
  selectedStats,
  walk,
  type SpiderEntry,
} from './spider.ts'
import { select } from './select.ts'
import { archiveSelection, loadArchive } from './car.ts'

const usage = `granite — Mïmis Granite CLI

Usage:
  granite keys generate
  granite publish <tree.json | ->
  granite latest <address>
  granite resolve <path> --mount <source>…
  granite history <address | update-cid>
  granite follow
  granite hydrate --mount <source>… [--name <alias>]
  granite spider <dir> [--out <file.car>] [--include <pattern>]… [--exclude <pattern>]… [--yes]
  granite load <file.car>

Global flags: --config <path> (default ./granite.json), --json
Sources are Update CIDs or publisher addresses (⇒ their whole chain).`

const { values, positionals } = parseArgs({
  options: {
    config: { type: 'string' },
    json: { type: 'boolean', default: false },
    mount: { type: 'string', multiple: true },
    name: { type: 'string' },
    out: { type: 'string' },
    include: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    yes: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  allowPositionals: true,
})

const die = (message: string, code: 1 | 2): never => {
  console.error(message)
  process.exit(code)
}

// spider and load work without chain configuration (spider degrades to
// a chainless update; load is strictly local, FR-010) — every other
// command still requires it.
type CliConfig = Omit<GraniteConfig, 'chain'> & { chain?: GraniteConfig['chain'] }

const loadConfig = ({ requireChain = true } = {}): CliConfig => {
  let fromFile: Partial<GraniteConfig> = {}
  const path = values.config ?? 'granite.json'
  try {
    fromFile = JSON.parse(readFileSync(path, 'utf8'))
  } catch(cause) {
    if(values.config) {
      die(`cannot read config ${path}: ${cause}`, 2)
    }
  }
  const env = process.env
  const chain = {
    rpcUrl: env.GRANITE_RPC_URL ?? fromFile.chain?.rpcUrl,
    registry: (env.GRANITE_REGISTRY ?? fromFile.chain?.registry) as Address,
  }
  const hasChain = Boolean(chain.rpcUrl && chain.registry)
  if(requireChain && !hasChain) {
    die('missing chain configuration (granite.json or GRANITE_RPC_URL/GRANITE_REGISTRY)', 2)
  }
  const key = (env.GRANITE_KEY ?? undefined) as `0x${string}` | undefined
  const gremlin = env.GRANITE_GREMLIN ?? fromFile.gremlin
  const depth = env.GRANITE_MAX_MOUNT_DEPTH ?? fromFile.maxMountDepth
  return {
    kubo: env.GRANITE_KUBO ?? fromFile.kubo ?? 'http://127.0.0.1:5001',
    ...(gremlin ? { gremlin } : {}),
    ...(hasChain ? { chain: chain as GraniteConfig['chain'] } : {}),
    ...(key ? { key } : {}),
    ...(depth === undefined ? {} : { maxMountDepth: Number(depth) }),
  }
}

const parseSource = (source: string): Mount['source'] => {
  if(isAddress(source)) {
    return source
  }
  try {
    return CID.parse(source)
  } catch {
    return die(`--mount ${source} is neither an update CID nor a lowercase address`, 2)
  }
}

const mounts = (): Mount[] => {
  const sources = values.mount ?? []
  if(sources.length === 0) {
    return die('at least one --mount <source> is required', 2)
  }
  return sources.map((source) => ({ source: parseSource(source) }))
}

const jsonToTree = (value: unknown, where: string): Tree => {
  if(typeof value !== 'object' || value === null || Array.isArray(value)) {
    return die(`${where}: tree must be an object`, 2)
  }
  const raw = value as Record<string, unknown>
  const tree: Tree = {}
  if(raw.data !== undefined) {
    tree.data = raw.data as Record<string, unknown>
  }
  if(raw.edges !== undefined) {
    tree.edges = {}
    for(const [name, edge] of Object.entries(raw.edges as Record<string, unknown>)) {
      const { props, child } = edge as { props?: Record<string, unknown>, child: unknown }
      tree.edges[name] = {
        ...(props ? { props } : {}),
        child: typeof child === 'string' ? (
          CID.parse(child)
        ) : (
          jsonToTree(child, `${where}/${name}`)
        ),
      }
    }
  }
  if(raw.mounts !== undefined) {
    tree.mounts = (raw.mounts as { source: string, path?: string, order: number }[])
    .map((mount) => ({
      source: parseSource(mount.source),
      ...(mount.path === undefined ? {} : { path: mount.path }),
      order: mount.order,
    }))
  }
  return tree
}

const emit = (json: unknown, human: string) => {
  console.log(values.json ? JSON.stringify(json) : human)
}

const withGranite = async (run: (granite: Granite) => Promise<void>) => {
  const granite = await connect(loadConfig() as GraniteConfig)
  try {
    await run(granite)
  } finally {
    await granite.close().catch(() => {})
  }
}

const commands: Record<string, () => Promise<void>> = {
  keys: async () => {
    if(positionals[1] !== 'generate') {
      die(usage, 2)
    }
    const key = generateKey()
    const address = addressOf(key)
    emit({ key, address }, `key:     ${key}\naddress: ${address}`)
  },

  publish: async () => {
    const file = positionals[1] ?? die('usage: granite publish <tree.json | ->', 2)
    const source = file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8')
    const tree = jsonToTree(JSON.parse(source), file)
    await withGranite(async (granite) => {
      const { update, root, prev } = await granite.publish(tree)
      emit(
        {
          update: update.toString(),
          root: root.toString(),
          ...(prev ? { prev: prev.toString() } : {}),
        },
        `update: ${update}\nroot:   ${root}${prev ? `\nprev:   ${prev}` : ''}`,
      )
    })
  },

  latest: async () => {
    const address = positionals[1]
    if(!isAddress(address)) {
      die('usage: granite latest <lowercase 0x address>', 2)
    }
    await withGranite(async (granite) => {
      const cid = await granite.latest(address as Address)
      emit(cid ? cid.toString() : null, cid ? cid.toString() : '(never published)')
    })
  },

  resolve: async () => {
    const path = positionals[1] ?? die('usage: granite resolve <path> --mount <source>…', 2)
    const stack = mounts()
    await withGranite(async (granite) => {
      const view = await granite.stack(stack)
      const resolved = await view.resolve(path as string)
      if(!resolved) {
        emit(null, '(not present)')
        return
      }
      emit(
        {
          node: resolved.node.toString(),
          ...(resolved.data ? { data: resolved.data } : {}),
          edges: Object.fromEntries(
            Object.entries(resolved.edges).map(([name, edge]) => [
              name,
              {
                ...(edge.props ? { props: edge.props } : {}),
                child: edge.child.toString(),
              },
            ]),
          ),
          via: resolved.via.toString(),
        },
        `node: ${resolved.node}\nvia:  ${resolved.via}\nedges: ${
          Object.keys(resolved.edges).join(', ') || '(none)'
        }`,
      )
    })
  },

  history: async () => {
    const from = positionals[1] ?? die('usage: granite history <address | update-cid>', 2)
    const start = isAddress(from) ? from as Address : CID.parse(from as string)
    await withGranite(async (granite) => {
      try {
        for await(const entry of granite.history(start)) {
          emit(
            {
              update: entry.update.toString(),
              publisher: entry.publisher,
              ...(entry.prev ? { prev: entry.prev.toString() } : {}),
              at: entry.at,
            },
            `${entry.update}  ${new Date(entry.at * 1000).toISOString()}`,
          )
        }
      } catch(error) {
        if(error instanceof UnreachableNodeError) {
          die(`history chain broken at ${error.cid}`, 1)
        }
        throw error
      }
    })
  },

  follow: async () => {
    const granite = await connect(loadConfig() as GraniteConfig)
    granite.follow((announcement) => {
      emit(
        {
          publisher: announcement.publisher,
          root: announcement.root.toString(),
          ...(announcement.prev ? { prev: announcement.prev.toString() } : {}),
          at: announcement.at,
        },
        `${announcement.publisher} → ${announcement.root}`,
      )
    })
    await new Promise(() => {})
  },

  hydrate: async () => {
    const stack = mounts()
    await withGranite(async (granite) => {
      const view = await granite.stack(stack, values.name)
      await view.hydrate()
      emit({ hydrated: view.key }, `hydrated stack ${view.key}`)
    })
  },

  spider: async () => {
    const dir = positionals[1]
      ?? die('usage: granite spider <dir> [--out <file.car>] [--include <pattern>]… [--exclude <pattern>]… [--yes]', 2)
    const config = loadConfig({ requireChain: false })
    if(!config.key) {
      throw new MissingKeyError('spider')
    }
    const root = await walk(dir as string)
    const warnUnreadable = (entry: SpiderEntry) => {
      if(entry.unreadable) {
        console.error(`skipped (unreadable): ${entry.path} — ${entry.unreadable}`)
      }
      entry.children?.forEach(warnUnreadable)
    }
    warnUnreadable(root)
    applyPatterns(root, {
      include: values.include ?? [],
      exclude: values.exclude ?? [],
    })
    if(values.yes) {
      if(selectedStats(root).files === 0) {
        die('selection matches nothing — refusing to write an empty archive', 1)
      }
    } else {
      if(!process.stdin.isTTY || !process.stdout.isTTY) {
        die('interactive selection requires a terminal — use --yes with --include/--exclude', 2)
      }
      if(!await select(root)) {
        die('aborted — no archive written', 1)
      }
    }
    const result = await archiveSelection(
      {
        kubo: kuboClient(config.kubo),
        store: kuboStore(config.kubo, { pin: false }),
        ...(config.chain ? {
          registry: ethereumRegistry({
            rpcUrl: config.chain.rpcUrl,
            registry: config.chain.registry,
          }),
        } : {}),
        key: config.key,
        warn: (message) => console.error(message),
      },
      dir as string,
      root,
      values.out,
    )
    emit(
      {
        car: result.car,
        update: result.update.toString(),
        root: result.root.toString(),
        ...(result.prev ? { prev: result.prev.toString() } : {}),
        files: result.files,
        bytes: result.bytes,
      },
      `archive: ${result.car}\nupdate:  ${result.update}\nroot:    ${result.root}${
        result.prev ? `\nprev:    ${result.prev}` : ''
      }\nfiles:   ${result.files}\nbytes:   ${result.bytes}`,
    )
  },

  load: async () => {
    const file = positionals[1] ?? die('usage: granite load <file.car>', 2)
    const config = loadConfig({ requireChain: false })
    const cache = config.gremlin ? (
      (await import('./cache.ts')).gremlinCache(config.gremlin)
    ) : (
      undefined
    )
    try {
      const result = await loadArchive(
        {
          kubo: kuboClient(config.kubo),
          ...(cache ? { cache } : {}),
        },
        file as string,
      )
      emit(
        {
          update: result.update.toString(),
          root: result.root.toString(),
          publisher: result.publisher,
          ...(result.prev ? { prev: result.prev.toString() } : {}),
          blocks: result.blocks,
        },
        `update:    ${result.update}\nroot:      ${result.root}\npublisher: ${result.publisher}${
          result.prev ? `\nprev:      ${result.prev}` : ''
        }\nblocks:    ${result.blocks}`,
      )
    } finally {
      await cache?.close().catch(() => {})
    }
  },
}

const main = async () => {
  if(values.help || positionals.length === 0) {
    console.log(usage)
    process.exit(values.help ? 0 : 2)
  }
  const command = commands[positionals[0]]
  if(!command) {
    die(`unknown command: ${positionals[0]}\n\n${usage}`, 2)
  }
  await command()
}

main().catch((error) => {
  die(String(error?.message ?? error), 1)
})
