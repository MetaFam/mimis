import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { error, isHttpError } from '@sveltejs/kit'
import { PAGE_SIZE } from '#lib/search.js'
import { quote, searchSpots } from '#lib/server/search.js'
import {
  addSpot, attach, link, mount, mountLink, seed, seedTree, seedUser, seedWide,
  transaction,
  type Id, type Tree,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']

const library: Tree = {
  by: {
    Austen: { Emma: {}, collected: { Emma: {} } },
    'Brontë': { "Emma's Letters": {} },
  },
  b: { emma: {}, c: { Gemma: {} } },
  d: {
    'Émma': {},
    'σοφία': {},
    'a.b': {},
    axb: {},
    '(x)': {},
    '[y': {},
    'back\\Eslash': {},
  },
  'Zed ✨': {},
}

let source: Source
let rollback: () => Promise<void>
let ids: Map<string, Id>

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  ids = await seed(source, library)
})

afterEach(async () => {
  await rollback()
})

const search = (
  parts: Array<string>,
  { at = '', path = [], offset = 0 }:
  { at?: string, path?: Array<string>, offset?: number } = {},
) => (
  searchSpots({ source, from: source.V(ids.get(at)!), path, parts, offset })
)

const found = async (
  parts: Array<string>, options?: Parameters<typeof search>[1],
) => (
  (await search(parts, options)).results.map(({ names }) => names.join('/'))
)

describe('quote', () => {
  it('wraps text as a Java regex literal', () => {
    expect(quote('a.b')).toBe('\\Qa.b\\E')
  })

  it('re-quotes an embedded end-of-quote', () => {
    expect(quote('x\\Ey')).toBe('\\Qx\\E\\\\E\\Qy\\E')
  })
})

describe('matching one part', () => {
  it('finds names containing the part, at every depth', async () => {
    expect(await found(['emm'])).toEqual([
      'b/emma',
      'b/c/Gemma',
      'by/Austen/Emma',
      "by/Brontë/Emma's Letters",
      'by/Austen/collected/Emma',
    ])
  })

  it('ignores case', async () => {
    expect(await found(['EMMA'])).toEqual(await found(['emma']))
  })

  it('folds Unicode case', async () => {
    expect(await found(['ΣΟΦΊΑ'])).toEqual(['d/σοφία'])
  })

  it('doesn’t fold accents', async () => {
    expect(await found(['émm'])).toEqual(['d/Émma'])
    expect(await found(['emm'])).not.toContain('d/Émma')
  })

  it.each([
    ['a.b', ['d/a.b']],
    ['(x', ['d/(x)']],
    ['[y', ['d/[y']],
    ['\\E', ['d/back\\Eslash']],
  ])('matches %j literally', async (part, expected) => {
    expect(await found([part])).toEqual(expected)
  })

  it('tests only the result’s own name', async () => {
    expect(await found(['by'])).toEqual(['by'])
  })

  it('never returns the Spot it starts from', async () => {
    expect(await found(['b'], { at: 'b' })).toEqual([])
  })

  it('finds nothing when nothing matches', async () => {
    expect(await search(['zzz'])).toEqual({ results: [], more: false })
  })
})

describe('matching several parts', () => {
  it('matches the parts at successive, not necessarily adjacent, levels', async () => {
    expect(await found(['austen', 'em'])).toEqual([
      'by/Austen/Emma',
      'by/Austen/collected/Emma',
    ])
  })

  it('needs a different Spot for each part', async () => {
    expect(await found(['austen', 'austen', 'em'])).toEqual([])
  })

  it('needs the parts in order', async () => {
    expect(await found(['emma', 'austen'])).toEqual([])
  })
})

describe('what gets walked', () => {
  it('doesn’t follow mounts below the start', async () => {
    const other = await addSpot(source)
    const hidden = await addSpot(source)
    await link(source, { from: other, to: hidden, name: 'emma-hidden' })
    await mount(source, { from: ids.get('d')!, to: other })
    expect(await found(['hidden'])).toEqual([])
  })

  it('lists a Spot with two parents once, at its shallowest match, & finishes', async () => {
    await link(source, { from: ids.get('d')!, to: ids.get('b/c')!, name: 'again' })
    expect(await found(['gem'])).toEqual(['b/c/Gemma'])
    expect(await found(['again', 'gem'])).toEqual(['d/again/Gemma'])
  })

  it('finishes when the tree has a cycle', async () => {
    await link(source, { from: ids.get('b/c')!, to: ids.get('b')!, name: 'loop' })
    expect(await found(['loop'])).toEqual(['b/c/loop'])
  })
})

describe('ordering', () => {
  it('orders by depth, then by name ignoring case, by code point', async () => {
    const at = await addSpot(source)
    for(const name of ['zebra', 'Apple', 'beet', 'Ärger']) {
      await link(source, { from: at, to: await addSpot(source), name })
    }
    const results = await searchSpots({
      source, from: source.V(at), path: [], parts: ['e'],
    })
    expect(results.results.map(({ names }) => names.join('/'))).toEqual([
      'Apple', 'beet', 'zebra', 'Ärger',
    ])
  })

  it('breaks ties by id', async () => {
    const at = await addSpot(source)
    const tied = []
    for(const name of ['X', 'x']) {
      const parent = await addSpot(source)
      await link(source, { from: at, to: parent, name })
      const child = await addSpot(source)
      await link(source, { from: parent, to: child, name: 'k' })
      tied.push(child)
    }
    const { results } = await searchSpots({
      source, from: source.V(at), path: [], parts: ['k'],
    })
    expect(results.map(({ id }) => id)).toEqual(
      [...tied].sort((a, b) => Number(a) - Number(b))
    )
  })
})

describe('previews', () => {
  const thumbs = async (parts: Array<string>) => (
    Object.fromEntries(
      (await search(parts)).results.map(({ names, thumb }) => (
        [names.join('/'), thumb]
      ))
    )
  )

  it('gives a result with an image a preview of it', async () => {
    await attach(source, { to: ids.get('b/emma')!, type: 'image/png', cid: 'bafyPNG' })
    expect((await thumbs(['emma']))['b/emma'])
    .toEqual({ type: 'image/png', cid: 'bafyPNG' })
  })

  it('previews a video too', async () => {
    await attach(source, { to: ids.get('b/emma')!, type: 'video/mp4', cid: 'bafyMP4' })
    expect((await thumbs(['emma']))['b/emma'])
    .toEqual({ type: 'video/mp4', cid: 'bafyMP4' })
  })

  it('gives no preview for content that can’t be shown', async () => {
    await attach(source, { to: ids.get('b/emma')!, type: 'text/plain', cid: 'bafyTXT' })
    expect((await thumbs(['emma']))['b/emma']).toBeNull()
  })

  it('gives no preview to a result without content', async () => {
    expect((await thumbs(['emma']))['b/c/Gemma']).toBeNull()
  })

  it('lists each result’s content types, best first', async () => {
    const to = ids.get('b/emma')!
    await attach(source, { to, type: 'text/plain', cid: 'bafyTXT' })
    await attach(source, { to, type: 'image/png', cid: 'bafyPNG' })
    const types = Object.fromEntries(
      (await search(['emma'])).results.map(({ names, types }) => (
        [names.join('/'), types]
      ))
    )
    expect(types['b/emma']).toEqual(['text/plain', 'image/png'])
    expect(types['b/c/Gemma']).toEqual([])
  })

  it('previews the best content, of several of one type (FR-015)', async () => {
    const to = ids.get('b/emma')!
    await attach(source, { to, type: 'image/png', cid: 'bafyPNG1' })
    await attach(source, { to, type: 'image/png', cid: 'bafyPNG2' })
    expect((await thumbs(['emma']))['b/emma'])
    .toEqual({ type: 'image/png', cid: 'bafyPNG1' })
  })

  it('gives no preview when the best content can’t be shown', async () => {
    const to = ids.get('b/emma')!
    await attach(source, { to, type: 'text/plain', cid: 'bafyTXT' })
    await attach(source, { to, type: 'image/png', cid: 'bafyPNG' })
    expect((await thumbs(['emma']))['b/emma']).toBeNull()
  })
})

describe('paging', () => {
  it('pages through every match exactly once, flagging when there’s more', async () => {
    const at = await addSpot(source)
    const names = Array.from({ length: 250 }, (_, i) => `match ${i}`)
    await seedWide(source, { under: at, names })
    const pages = []
    for(const offset of [0, 100, 200]) {
      pages.push(await searchSpots({
        source, from: source.V(at), path: [], parts: ['match'], offset,
      }))
    }
    expect(pages.map(({ results }) => results.length)).toEqual([100, 100, 50])
    expect(pages.map(({ more }) => more)).toEqual([true, true, false])
    const all = pages.flatMap(({ results }) => results)
    expect(new Set(all.map(({ id }) => id)).size).toBe(250)
    expect(all.map(({ names }) => names[0])).toEqual([...names].sort())
  })
})

describe('where the search starts', () => {
  it('starts from a Spot reached through a mount on the way', async () => {
    const other = await addSpot(source)
    const hidden = await addSpot(source)
    await link(source, { from: other, to: hidden, name: 'emma-hidden' })
    await link(source, { from: hidden, to: await addSpot(source), name: 'deep' })
    await mount(source, { from: ids.get('d')!, to: other })
    expect(await found(['deep'], { path: ['d', 'emma-hidden'] }))
    .toEqual(['deep'])
  })

  it('prefers the Spot of highest precedence', async () => {
    const root = ids.get('')!
    const mine = await addSpot(source)
    await link(source, { from: root, to: mine, name: 'p' })
    await link(source, { from: mine, to: await addSpot(source), name: 'mine' })
    const layer = await addSpot(source)
    const theirs = await addSpot(source)
    await link(source, { from: layer, to: theirs, name: 'p' })
    await link(source, { from: theirs, to: await addSpot(source), name: 'theirs' })
    await mount(source, { from: root, to: layer })
    expect(await found(['mine'], { path: ['p'] })).toEqual(['mine'])
    expect(await found(['theirs'], { path: ['p'] })).toEqual([])
  })
})

describe('errors', () => {
  const failing = (thrown: unknown) => ({
    V: () => { throw thrown },
  }) as unknown as Source

  const rejection = async (promise: Promise<unknown>) => {
    try {
      await promise
    } catch(err) {
      if(!isHttpError(err)) throw err
      return { status: err.status, message: err.body.message }
    }
    throw new Error('Expected a rejection.')
  }

  it('is a 404 when the path leads nowhere', async () => {
    expect(await rejection(search(['x'], { path: ['nope'] }))).toEqual({
      status: 404, message: 'No Spot at /nope/.',
    })
  })

  it('is a 500 when the traversal fails', async () => {
    expect(await rejection(searchSpots({
      source: failing(new Error('boom')),
      from: source.V(ids.get('')!),
      path: [],
      parts: ['x'],
    }))).toEqual({ status: 500, message: 'Search: "boom"' })
  })

  it('is a 500 explaining a connection failure', async () => {
    const { status, message } = await rejection(searchSpots({
      source: failing(new TypeError('fetch failed')),
      from: source.V(ids.get('')!),
      path: [],
      parts: ['x'],
    }))
    expect(status).toBe(500)
    expect(message).toMatch(/^Search: "Connection Error:/)
  })

  it('passes an HTTP error through unchanged', async () => {
    let teapot: unknown
    try {
      error(418, 'teapot')
    } catch(err) {
      teapot = err
    }
    expect(await rejection(searchSpots({
      source: failing(teapot),
      from: source.V(ids.get('')!),
      path: [],
      parts: ['x'],
    }))).toEqual({ status: 418, message: 'teapot' })
  })
})

describe('performance', () => {
  it('answers each page within a second in a 10,000-Spot subtree', async () => {
    const at = await addSpot(source)
    const names = Array.from(
      { length: 10_000 },
      (_, i) => `item ${i} ${i % 10 === 0 ? 'Emma' : 'x'}`,
    )
    await seedWide(source, { under: at, names })
    const times = []
    let more = true
    for(let offset = 0; more; offset += PAGE_SIZE) {
      const start = performance.now()
      const page = await searchSpots({
        source, from: source.V(at), path: [], parts: ['emm'], offset,
      })
      times.push(performance.now() - start)
      more = page.more
    }
    expect(times).toHaveLength(10)
    expect(Math.max(...times)).toBeLessThan(1_000)
  }, 60_000)
})

describe('mounted links (FR-013)', () => {
  let b: Id
  let theirs: Map<string, Id>

  beforeEach(async () => {
    ;({ root: b } = await seedUser(source, { address: '0xb' }))
    const { root: s } = await seedUser(source, { address: '0xs' })
    theirs = await seedTree(source, {
      root: s, tree: { image: { hatz: { top: {}, bowler: {} } } },
    })
    await mount(source, { from: b, to: s })
    const image = (await seedTree(source, { root: b, tree: { image: {} } })).get('image')!
    const { value: uuid } = await (
      source.V(theirs.get('image')!).outE('CONTAINS').values('uuid').next()
    )
    const { value: parent } = await source.V(theirs.get('image')!).values('uuid').next()
    await mountLink(source, {
      from: image,
      to: theirs.get('image/hatz')!,
      uuid: uuid as string,
      path: 'hats',
      parent: parent as string,
    })
  })

  const under = async (path: Array<string>, parts: Array<string>) => (
    (await searchSpots({ source, from: source.V(b), path, parts }))
    .results.map(({ names }) => names.join('/'))
  )

  it('finds a mounted link by its mount’s name', async () => {
    expect(await under([], ['hat'])).toEqual(['image/hats'])
  })

  it('starts below a mounted link', async () => {
    expect(await under(['image', 'hats'], ['top'])).toEqual(['top'])
    await expect(under(['image', 'hatz'], ['top'])).rejects.toMatchObject({ status: 404 })
  })

  it('finishes when a mounted link’s target links back up', async () => {
    await link(source, { from: theirs.get('image/hatz')!, to: b, name: 'up' })
    expect(await under([], ['hats'])).toEqual(['image/hats'])
  })
})
