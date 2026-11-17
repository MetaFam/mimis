import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  assembleListing, listingTraversal, resolvePath,
} from '#lib/server/listing.js'
import {
  addSpot, link, mount, seed, transaction, type Id,
} from '#lib/server/testing.js'

type Source = ReturnType<typeof transaction>['source']
type Rows = Parameters<typeof assembleListing>[0]

let source: Source
let rollback: () => Promise<void>
let ids: Map<string, Id>
let other: Id
let y: Id

beforeEach(async () => {
  ;({ source, rollback } = transaction())
  ids = await seed(source, { x: {} })
  other = await addSpot(source)
  y = await addSpot(source)
  await link(source, { from: other, to: y, name: 'y' })
  await mount(source, { from: ids.get('x')!, to: other })
})

afterEach(async () => {
  await rollback()
})

const root = () => source.V(ids.get('')!)

describe('listingTraversal', () => {
  it('lists a mounted layer’s children under the mounting Spot', async () => {
    const rows = await (
      listingTraversal({ from: root(), path: ['x'] }).toList()
    ) as Rows
    const listing = assembleListing(rows)
    expect(listing.layers).toEqual([ids.get('x'), other])
    expect(listing.contents).toEqual([])
    expect(listing.children).toEqual([{
      name: 'y',
      ids: [y],
      parents: [other],
      contents: [],
      container: false,
    }])
  })
})

describe('resolvePath', () => {
  const resolved = (path: Array<string>) => (
    resolvePath({ from: root(), path }).id().toList()
  )

  it('reaches a Spot through a mount on the way', async () => {
    expect(await resolved(['x', 'y'])).toEqual([y])
  })

  it('resolves an empty path to where it started', async () => {
    expect(await resolved([])).toEqual([ids.get('')])
  })

  it('resolves a missing name to nothing', async () => {
    expect(await resolved(['nope'])).toEqual([])
  })

  it('leaves the end’s own mounts to the caller', async () => {
    expect(await resolved(['x'])).toEqual([ids.get('x')])
  })
})
