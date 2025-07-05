import type { Record as Neo4jRecord } from 'neo4j-driver'
import { getNeo4j } from './neo4jDriver.ts'

type Primitive = string | number | boolean | ((...args: Array<any>) => any) | null | undefined
interface NöopointConflictType extends Record<
  string, Primitive | Array<NöopointConflictType>
> {
  id?: string | number | null
}

class UninitializedError extends Error {}

export type Op = {
  condition?: () => boolean
  branch?: {
    if?: () => unknown
    else?: () => unknown
  }
}

export function toggle({
  condition = () => true,
  branch = { if: () => {}, else: () => {} }
}: Op) {
  return (() => {
    if(condition?.()) {
      return branch?.if?.()
    } else {
      return branch?.else?.()
    }
  })
}

export const records2Objects = (records: Array<Neo4jRecord>) => (
  records.map(record2Object)
)

export const records2Object = (records: Array<Neo4jRecord>) => (
  records2Objects(records)[0]
)

export const record2Object = (record: Neo4jRecord) => (
  Object.fromEntries(record.keys.map((key) => (
    [key, record.get(key)]
  )))
)

let count = 0
export const identify = (objArray: Array<Record<string, unknown>>) => (
  objArray.map((obj, idx) => ({ id: ++count, ...obj }))
)

type NöopointConfigType = any

type GetNöopointConfig = {
  offset?: number
  limit?: number
  onlyCurrent?: boolean
  sep?: string
  parent?: NöopointConflictType
}

export class Nöopoint {
  point = this
  neo4j: ReturnType<typeof getNeo4j> | null = null
  #config: NöopointConfigType = null
  static #root: NöopointConfigType = null

  constructor(config: NöopointConfigType) {
    this.#config = config
  }

  static get root() {
    if(!this.#root) {
      this.#root = (
        this.get.root().then(
          (root: NöopointConflictType) => this.#root = root
        )
      )
    }
    return this.#root
  }

  static gen = {
    child: (path?: string | Array<string>) => {
      const points = this.create({ path: path ?? `∅/sys/points/new/` })
      if(!Array.isArray(points)) throw new Error(`\`this.create()\` didn’t return an \`Array\` (${typeof(points)}).`)
      if(points.length !== 1) throw new Error(`\`this.create()\` returned ${points.length} points.`)
      if(points.length === 1) {
        return points[0]
      }
    }
  }

  static create = async (
    { path, sep = '/' }: {
      path: string | Array<string>
      sep?: string
    }) => {
    const neo4j = getNeo4j()
    if(!neo4j) throw new Error('`neo4j` is unset.')
    const session = neo4j.session()

    if(typeof(path) === 'string') {
      path = path.split(sep)
    }

    let current = await this.get.root()
    for(const elem in path) {
      const pathQuery = `
        MERGE (current)-[:CONTAINS { path: $elem }]->(new:Nöopoint)
        WHERE elementId(current) = $current
        RETURN elementId(new)
      `
      const { records } = await session.run(
        pathQuery, { current, elem },
      )
      if(records.length != 1) throw new Error(`${records.length} records returned.`)
      current = records[0].get('id')
    }
  }

  static get = {
    root: async () => {
      const neo4j = getNeo4j()
      if(!neo4j) throw new Error('`neo4j` is unset.')
      const session = neo4j.session()

      try {
        const rootQuery = `
          MERGE (root:Root)
          RETURN elementId(root)
        `
        const { records } = await session.run(rootQuery)

        if(records.length != 1) throw new Error(`${records.length} records returned.`)

        return record2Object(records)
      } finally {
        session.close()
        neo4j.close()
      }
    },
    children: async (
      path: string | Array<string>,
      {
        offset = 0,
        limit,
        onlyCurrent = false,
        sep = '/',
        parent,
      }:GetNöopointConfig  = {} as GetNöopointConfig
    ) => {
      const neo4j = getNeo4j()
      const session = neo4j.session()

      try {
        if(typeof(path) === 'string') {
          path = path.split(sep).filter(Boolean)
        }

        let init = false
        while(!init) {
          try {
            let rootId = parent?.id
            if(rootId == null) {
              init = true
              rootId = Nöopoint.root
            }
            const vals = {
              limit: limit != null ? Number(limit) : 0,
              offset: Number(offset),
            }

            const pathTraveral = `
              WITH $elems as pathElems
              MATCH path = (start)-[:CONTAINS*]->(terminal)
              WHERE elementId(start) = $rootId
              MATCH (terminal)-[:REPRESENTED_BY]->(point)
              ${onlyCurrent ? 'WHERE NOT ()-[:PREVIOUS]->(point)' : ''}
              WITH pathElems, path, terminal, point, [
                rel in relationships(path)
                WHERE NOT isEmpty(rel.path)
                | rel.path
              ] as elements
              WHERE size(elements) = size(pathElems)
              AND ALL(
                i IN range(0, size(pathElems) - 1)
                WHERE (
                  pathElems[i] = '*'
                  OR elements[i] = pathElems[i]
                )
              )
              ${vals.limit > 0 ? `LIMIT ${vals.offset + vals.limit}` : ''}
              SKIP ${vals.offset}
              RETURN DISTINCT
                elements as path,
                terminal as pathEnd,
                point as nöopoint
            `

            const { records } = await session.run(
              pathTraveral, { elems: path, rootId }
            )

            return records2Object(records)
          } catch(err) {
            if(!(err instanceof UninitializedError)) throw err
            init = false // Was an unintialized value
          }
        }
      } finally {
        await session.close()
        await neo4j.close()
      }
    },
    partial: async (path: string | Array<string>) => {
      const neo4j = getNeo4j()
      const session = neo4j.session()
      try {
        //ToDo: return partial completion
      } finally {
        await session.close()
        await neo4j.close()
      }
    },
  }
}