import { process, structure, driver } from 'gremlin'
import * as v from 'valibot'
import { query } from '$app/server'

const { statics: __, t: T } = process
const { DriverRemoteConnection } = driver
const { Graph } = structure

interface ReturnEntry extends Map<'path' | 'id', string | number> {}
interface DirectoryEntry {
  path: string
  id: number
}

const SearchSchema = v.object({
  path: v.array(v.string()),
  options: v.optional(v.object({
    maxMountDepth: v.optional(v.number(), 10),
    allowCycles: v.optional(v.boolean(), false),
  })),
})

export const searchFor = query(
  SearchSchema,
  async ({
    path = [],
    options = {
      maxMountDepth: 10,
      allowCycles: false,
    },
  }): Promise<Record<string, number>> => {
    const { maxMountDepth: maxDepth, allowCycles } = options
    const connection = new DriverRemoteConnection(
      'ws://localhost:8182/gremlin',
    )
    const g = process.traversal().withRemote(connection)

    path = path.filter(Boolean)

    try {
      let traversal = g.V().has(T.label, 'Root')

      for (const element of path) {
        if (!allowCycles) {
          traversal = traversal.simplePath()
        }

        traversal = traversal.flatMap(
          __.union(
            (
              __.out('CONTAINS')
              .has('path', element)
            ),
            (
              __.repeat(
                __.outE('MOUNT')
                .order()
                .by('order')
                .inV()
              )
              .times(maxDepth)
              .emit()
              .out('CONTAINS')
              .has('path', element)
            ),
          )
        )
      }

      // Now get children of resolved directories
      const results = (
        await traversal
        .outE('CONTAINS')
        .project('path', 'id')
        .by(__.values('path'))
        .by(__.inV().id())
        .toList()
      ) as Array<ReturnEntry>

      const merged = new Map<string, DirectoryEntry['id']>()
      for(const entry of results) {
        const [path, id] = [entry.get('path')?.toString(), entry.get('id')]
        if(path && typeof(id) === 'number' && !merged.has(path)) {
          merged.set(path, id)
        } else {
          console.error({ 'Bad Values': { path, id } })
        }
      }

      // const out = Array.from(merged, ([path, id]) => ({ path, id }))
      const out = Object.fromEntries(merged)
      return out
    } finally {
      await connection.close()
    }
  }
)
