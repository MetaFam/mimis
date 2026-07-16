import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  chmodSync,
  cpSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  applyPatterns,
  assertEdgeName,
  selectedFiles,
  selectedStats,
  toggle,
  walk,
  type SpiderEntry,
} from '#lib/spider.ts'

// Fixture conventions are documented in tests/fixtures/README.md: the
// tree is copied to a temp dir, `gitignore` files become `.gitignore`,
// and unrepresentable entries (symlink, mode-000) are created here.
const fixture = new URL('../fixtures/spider/', import.meta.url).pathname
let root = ''

const restoreGitignores = (dir: string) => {
  for(const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if(entry.isDirectory()) {
      restoreGitignores(path)
    } else if(entry.name === 'gitignore') {
      renameSync(path, join(dir, '.gitignore'))
    }
  }
}

before(() => {
  root = join(mkdtempSync(join(tmpdir(), 'granite-spider-')), 'spider')
  cpSync(fixture, root, { recursive: true })
  restoreGitignores(root)
  symlinkSync('.', join(root, 'loop'))
  writeFileSync(join(root, 'secret.bin'), 'locked')
  chmodSync(join(root, 'secret.bin'), 0o000)
  writeFileSync(join(root, 'vault'), '')
  rmSync(join(root, 'vault'))
  cpSync(fixture, join(root, 'vault'), { recursive: true })
  chmodSync(join(root, 'vault'), 0o000)
})

after(() => {
  chmodSync(join(root, 'vault'), 0o755)
  chmodSync(join(root, 'secret.bin'), 0o644)
  rmSync(join(root, '..'), { recursive: true, force: true })
})

const child = (entry: SpiderEntry, name: string): SpiderEntry => {
  const found = entry.children?.find((each) => each.name === name)
  assert.ok(found, `expected child ${name} under ${entry.name}`)
  return found
}

describe('walk (US1, FR-001, FR-011)', () => {
  it('mirrors the directory tree with names, kinds, and sizes', async () => {
    const tree = await walk(root)
    assert.equal(tree.kind, 'dir')
    const docs = child(tree, 'docs')
    assert.equal(docs.kind, 'dir')
    const hello = child(docs, 'hello.txt')
    assert.equal(hello.kind, 'file')
    assert.equal(hello.size, 14)
    assert.equal(hello.children, undefined)
    const nested = child(child(docs, 'deep'), 'nested.txt')
    assert.equal(nested.size, 11)
    assert.ok(docs.size >= hello.size + nested.size)
  })

  it('sorts children by name for deterministic archives (FR-005)', async () => {
    const tree = await walk(root)
    const names = (tree.children ?? []).map(({ name }) => name)
    assert.deepEqual(names, [...names].sort())
  })

  it('never follows symlinks (FR-011)', async () => {
    const tree = await walk(root)
    assert.equal(tree.children?.find(({ name }) => name === 'loop'), undefined)
  })

  it('surfaces unreadable entries with reasons and keeps walking (FR-011)', async () => {
    const tree = await walk(root)
    const secret = child(tree, 'secret.bin')
    assert.ok(secret.unreadable, 'unreadable file carries a reason')
    assert.equal(secret.selected, false)
    const vault = child(tree, 'vault')
    assert.equal(vault.kind, 'dir')
    assert.ok(vault.unreadable, 'unreadable dir carries a reason')
    assert.deepEqual(vault.children, [])
    assert.ok(child(tree, 'docs'), 'walk continued past unreadable entries')
  })
})

describe('default exclusions (US1, FR-003)', () => {
  it('marks hidden entries excluded but visible', async () => {
    const tree = await walk(root)
    const hidden = child(tree, '.hidden')
    assert.equal(hidden.defaultExcluded, true)
    assert.equal(hidden.selected, false)
    assert.equal(child(tree, '.gitignore').defaultExcluded, true)
  })

  it('honors gitignore semantics: patterns, negation, directory-only', async () => {
    const tree = await walk(root)
    assert.equal(child(tree, 'scratch.bak').defaultExcluded, true)
    assert.equal(child(tree, 'keep.bak').defaultExcluded, false)
    const build = child(tree, 'build')
    assert.equal(build.defaultExcluded, true)
    assert.equal(child(build, 'out.txt').selected, false)
  })

  it('applies nested ignore files relative to their directory', async () => {
    const tree = await walk(root)
    const sub = child(tree, 'sub')
    assert.equal(child(sub, 'local.txt').defaultExcluded, true)
    assert.equal(child(sub, 'kept.txt').defaultExcluded, false)
    assert.equal(child(sub, 'kept.txt').selected, true)
  })
})

describe('selection model (US1, FR-002, SC-005)', () => {
  it('toggles a directory as a subtree', async () => {
    const tree = await walk(root)
    const docs = child(tree, 'docs')
    toggle(docs)
    assert.equal(docs.selected, false)
    assert.equal(child(docs, 'hello.txt').selected, false)
    assert.equal(child(child(docs, 'deep'), 'nested.txt').selected, false)
    toggle(docs)
    assert.equal(child(child(docs, 'deep'), 'nested.txt').selected, true)
  })

  it('opts hidden entries back in individually', async () => {
    const tree = await walk(root)
    const hidden = child(tree, '.hidden')
    toggle(hidden)
    assert.equal(hidden.selected, true)
  })

  it('never selects unreadable entries, even inside a subtree toggle', async () => {
    const tree = await walk(root)
    const secret = child(tree, 'secret.bin')
    toggle(secret)
    assert.equal(secret.selected, false)
    toggle(tree)
    toggle(tree)
    assert.equal(tree.selected, true)
    assert.equal(secret.selected, false)
    assert.equal(child(tree, 'vault').selected, false)
  })

  it('reports selected files and stats; empty selection is detectable', async () => {
    const tree = await walk(root)
    const files = selectedFiles(tree)
    const paths = files.map(({ path }) => path).sort()
    assert.deepEqual(paths, [
      'docs/deep/nested.txt',
      'docs/guide.md',
      'docs/hello.txt',
      'keep.bak',
      'sub/kept.txt',
    ])
    const stats = selectedStats(tree)
    assert.equal(stats.files, 5)
    assert.equal(stats.bytes, files.reduce((total, { size }) => total + size, 0))
    toggle(tree)
    assert.equal(tree.selected, false)
    assert.equal(selectedStats(tree).files, 0)
    assert.deepEqual(selectedFiles(tree), [])
  })
})

describe('pattern selection (US3, FR-006, SC-005)', () => {
  const paths = (tree: SpiderEntry) => (
    selectedFiles(tree).map(({ path }) => path).sort()
  )

  it('excludes on top of the default selection', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { exclude: ['docs/*.md'] })
    assert.deepEqual(paths(tree), [
      'docs/deep/nested.txt',
      'docs/hello.txt',
      'keep.bak',
      'sub/kept.txt',
    ])
  })

  it('excludes whole directories by name', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { exclude: ['docs'] })
    assert.deepEqual(paths(tree), ['keep.bak', 'sub/kept.txt'])
  })

  it('limits selection to includes when given', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { include: ['docs'] })
    assert.deepEqual(paths(tree), [
      'docs/deep/nested.txt',
      'docs/guide.md',
      'docs/hello.txt',
    ])
  })

  it('lets an explicit include opt a hidden entry back in', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { include: ['.hidden'] })
    assert.deepEqual(paths(tree), ['.hidden'])
  })

  it('exclude wins over include on ties', async () => {
    const tree = await walk(root)
    applyPatterns(tree, {
      include: ['docs'],
      exclude: ['docs/hello.txt'],
    })
    assert.deepEqual(paths(tree), [
      'docs/deep/nested.txt',
      'docs/guide.md',
    ])
  })

  it('honors gitignore negation inside a pattern list', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { exclude: ['docs/*', '!docs/guide.md'] })
    assert.deepEqual(paths(tree), [
      'docs/guide.md',
      'keep.bak',
      'sub/kept.txt',
    ])
  })

  it('leaves an empty selection detectable, not an archive (FR-006)', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { include: ['no/such/thing'] })
    assert.equal(selectedStats(tree).files, 0)
    assert.deepEqual(selectedFiles(tree), [])
  })

  it('never selects unreadable entries, even by explicit include', async () => {
    const tree = await walk(root)
    applyPatterns(tree, { include: ['secret.bin'] })
    assert.deepEqual(paths(tree), [])
  })

  it('produces the same selection as equivalent manual toggles (SC-005)', async () => {
    const scripted = await walk(root)
    applyPatterns(scripted, { exclude: ['docs'] })
    const manual = await walk(root)
    toggle(child(manual, 'docs'))
    assert.deepEqual(paths(scripted), paths(manual))
    assert.deepEqual(selectedStats(scripted), selectedStats(manual))
  })
})

describe('edge-name guard (spec edge case)', () => {
  it('rejects names containing "/" or empty names loudly', () => {
    assert.throws(() => assertEdgeName('a/b'), /must not contain/)
    assert.throws(() => assertEdgeName(''), /non-empty/)
    assert.equal(assertEdgeName('plain.txt'), 'plain.txt')
  })
})
