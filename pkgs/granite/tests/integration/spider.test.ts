// US1/US2/US3 live round trip (spider → CAR → load → resolve) plus CLI
// contract tests (contracts/cli.md); Kubo required, anvil for chaining.
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGranite } from '#lib/index.ts'
import { CID } from '#lib/codec.ts'
import { MalformedDocumentError, UnreachableNodeError } from '#lib/errors.ts'
import { generateKey } from '#lib/keys.ts'
import { kuboStore } from '#lib/store.ts'
import { ethereumRegistry } from '#lib/registry.ts'
import { catFile, kuboClient } from '#lib/files.ts'
import { applyPatterns, walk } from '#lib/spider.ts'
import { archiveSelection, loadArchive, type SpiderPorts } from '#lib/car.ts'
import { deployRegistry } from '../../scripts/deploy-registry.ts'
import { memoryAnnouncer, memoryRegistry } from '../fakes.ts'
import { anvilUp, fundedKeys, kuboUp, kuboUrl, rpcUrl } from './env.ts'

const cli = fileURLToPath(import.meta.resolve('#lib/cli.ts'))

const runCli = (
  args: string[], env: Record<string, string> = {}, cwd?: string,
): { code: number, stdout: string, stderr: string } => {
  const { status, stdout, stderr } = spawnSync(
    process.execPath,
    [cli, ...args],
    {
      // Blank every GRANITE_* var: the dev environment exports chain +
      // gremlin config, and these contract tests specify their own world.
      env: {
        ...process.env,
        GRANITE_KEY: '',
        GRANITE_RPC_URL: '',
        GRANITE_REGISTRY: '',
        GRANITE_GREMLIN: '',
        ...env,
      },
      ...(cwd ? { cwd } : {}),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
  return {
    code: status ?? 1,
    stdout: stdout ?? '',
    stderr: stderr ?? '',
  }
}

// The quickstart demo tree: one visible doc, one hidden secret.
const demoDir = (): string => {
  const base = mkdtempSync(join(tmpdir(), 'granite-demo-'))
  const demo = join(base, 'demo')
  mkdirSync(join(demo, 'docs'), { recursive: true })
  writeFileSync(join(demo, 'docs', 'hello.txt'), 'hello granite\n')
  writeFileSync(join(demo, '.env'), 'secret\n')
  return demo
}

const ports = (key = generateKey()): SpiderPorts => ({
  kubo: kuboClient(kuboUrl),
  store: kuboStore(kuboUrl),
  key,
  warn: () => {},
})

const spiderDemo = async (demo: string, out: string) => {
  const root = await walk(demo)
  applyPatterns(root, { exclude: [] })
  return await archiveSelection(ports(), demo, root, out)
}

describe(
  'spider → CAR → load → resolve round trip (Kubo)',
  { skip: !kuboUp && 'kubo not reachable' },
  () => {
    it('survives the round trip byte-identically (SC-002)', async () => {
      const demo = demoDir()
      const car = join(demo, '..', 'demo.car')
      const archived = await spiderDemo(demo, car)
      assert.equal(archived.files, 1)
      assert.equal(archived.bytes, 14)
      assert.equal(archived.prev, undefined)

      const kubo = kuboClient(kuboUrl)
      const loaded = await loadArchive({ kubo }, car)
      assert.ok(loaded.update.equals(archived.update))
      assert.ok(loaded.root.equals(archived.root))
      assert.equal(loaded.prev, undefined)
      assert.ok(loaded.blocks >= 4, `closure has the tree and content (${loaded.blocks})`)

      const granite = createGranite({
        store: kuboStore(kuboUrl),
        registry: memoryRegistry().for(),
        announcer: memoryAnnouncer().for(),
        log: () => {},
      })
      const stack = await granite.stack([{ source: loaded.update }])
      const resolved = await stack.resolve('/docs/hello.txt')
      assert.ok(resolved, 'archived path resolves after load')
      assert.equal(resolved.data?.size, 14)
      assert.equal(resolved.data?.type, 'text/plain')
      const content = CID.asCID(resolved.data?.content)
      assert.ok(content, 'file leaf links its content')
      const bytes = await catFile(kubo, content)
      assert.equal(new TextDecoder().decode(bytes), 'hello granite\n')
      const secret = await stack.resolve('/.env')
      assert.equal(secret, undefined, 'deselected entries leave no trace')
      await granite.close()
    })

    it('is deterministic (FR-005) and idempotent to load (SC-003)', async () => {
      const demo = demoDir()
      const first = await spiderDemo(demo, join(demo, '..', 'first.car'))
      const second = await spiderDemo(demo, join(demo, '..', 'second.car'))
      assert.ok(first.root.equals(second.root), 'same bytes ⇒ same root CID')

      const kubo = kuboClient(kuboUrl)
      const once = await loadArchive({ kubo }, first.car)
      const twice = await loadArchive({ kubo }, first.car)
      assert.ok(once.update.equals(twice.update))
      assert.equal(once.blocks, twice.blocks)
    })

    it('rejects truncated and non-CAR archives, naming the offender (SC-004)', async () => {
      const demo = demoDir()
      const car = join(demo, '..', 'whole.car')
      await spiderDemo(demo, car)
      const kubo = kuboClient(kuboUrl)

      const truncated = join(demo, '..', 'broken.car')
      writeFileSync(truncated, readFileSync(car).subarray(0, 512))
      await assert.rejects(
        loadArchive({ kubo }, truncated),
        (error: Error) => (
          error instanceof MalformedDocumentError || error instanceof UnreachableNodeError
        ),
      )

      const garbage = join(demo, '..', 'garbage.car')
      writeFileSync(garbage, 'not a car\n')
      await assert.rejects(
        loadArchive({ kubo }, garbage),
        (error: MalformedDocumentError) => (
          error instanceof MalformedDocumentError && error.cid === garbage
        ),
      )
    })
  },
)

describe(
  'spider chains prev when the registry is reachable (Kubo + anvil)',
  { skip: (!kuboUp || !anvilUp) && 'kubo/anvil not reachable' },
  () => {
    it('links the publisher’s latest update (research.md R6)', async () => {
      const registryAddress = await deployRegistry(rpcUrl, fundedKeys[0])
      const registry = ethereumRegistry({
        rpcUrl,
        registry: registryAddress,
        key: fundedKeys[1],
      })
      const demo = demoDir()
      const chainless = await archiveSelection(
        { ...ports(fundedKeys[1]), registry },
        demo,
        await walk(demo),
        join(demo, '..', 'one.car'),
      )
      assert.equal(chainless.prev, undefined, 'nothing published yet ⇒ chainless')
      await registry.publish(chainless.update)
      const chained = await archiveSelection(
        { ...ports(fundedKeys[1]), registry },
        demo,
        await walk(demo),
        join(demo, '..', 'two.car'),
      )
      assert.ok(chained.prev?.equals(chainless.update), 'second archive chains to the first')
    })
  },
)

describe(
  'CLI contract (contracts/cli.md)',
  { skip: !kuboUp && 'kubo not reachable' },
  () => {
    let demo = ''
    before(() => {
      demo = demoDir()
    })

    it('spider --yes emits the JSON shape and a chainless warning', () => {
      const { code, stdout, stderr } = runCli(
        ['spider', demo, '--yes', '--json', '--out', 'demo.car'],
        { GRANITE_KUBO: kuboUrl, GRANITE_KEY: generateKey() },
        join(demo, '..'),
      )
      assert.equal(code, 0)
      const result = JSON.parse(stdout)
      assert.equal(result.car, 'demo.car')
      assert.match(result.update, /^bafy/)
      assert.match(result.root, /^bafy/)
      assert.equal(result.files, 1)
      assert.equal(result.bytes, 14)
      assert.match(stderr, /chainless/)
    })

    it('spider --yes with patterns applies them; empty selection is exit 1', () => {
      const env = { GRANITE_KUBO: kuboUrl, GRANITE_KEY: generateKey() }
      const excluded = runCli(
        ['spider', demo, '--yes', '--json', '--exclude', 'docs', '--include', '.env', '--out', 'env.car'],
        env,
        join(demo, '..'),
      )
      assert.equal(excluded.code, 0)
      assert.equal(JSON.parse(excluded.stdout).files, 1)
      const empty = runCli(
        ['spider', demo, '--yes', '--exclude', '*'],
        env,
        join(demo, '..'),
      )
      assert.equal(empty.code, 1)
      assert.match(empty.stderr, /empty archive/)
    })

    it('spider without a key is exit 1; without a TTY or --yes, exit 2', () => {
      const keyless = runCli(['spider', demo, '--yes'], { GRANITE_KUBO: kuboUrl })
      assert.equal(keyless.code, 1)
      assert.match(keyless.stderr, /publishing key/)
      const interactive = runCli(
        ['spider', demo],
        { GRANITE_KUBO: kuboUrl, GRANITE_KEY: generateKey() },
      )
      assert.equal(interactive.code, 2)
    })

    it('load round-trips via CLI, is idempotent, and rejects damage', () => {
      const env = { GRANITE_KUBO: kuboUrl, GRANITE_KEY: generateKey() }
      const spidered = runCli(
        ['spider', demo, '--yes', '--json', '--out', 'cli.car'],
        env,
        join(demo, '..'),
      )
      assert.equal(spidered.code, 0)
      const { update } = JSON.parse(spidered.stdout)

      const loaded = runCli(['load', 'cli.car', '--json'], env, join(demo, '..'))
      assert.equal(loaded.code, 0)
      const result = JSON.parse(loaded.stdout)
      assert.equal(result.update, update)
      assert.match(result.publisher, /^0x[0-9a-f]{40}$/)
      assert.equal(result.prev, undefined)
      assert.ok(result.blocks >= 4)

      const again = runCli(['load', 'cli.car', '--json'], env, join(demo, '..'))
      assert.equal(again.code, 0)
      assert.equal(JSON.parse(again.stdout).update, update)

      writeFileSync(
        join(demo, '..', 'broken.car'),
        readFileSync(join(demo, '..', 'cli.car')).subarray(0, 512),
      )
      const broken = runCli(['load', 'broken.car'], env, join(demo, '..'))
      assert.equal(broken.code, 1)
      assert.notEqual(broken.stderr.trim(), '', 'offender named on stderr')
    })
  },
)
