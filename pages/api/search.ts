import { sessionOpts } from '@/config'
import {
  APIError, Maybe, MeResponse, Pathset, SearchResponse,
} from '@/types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session'
import JSON5 from 'json5'
import Neo4j from 'neo4j-driver'
import { verifyNeo4j } from '@/lib/helpers'

const { NEO4J_DATABASE: database, DEBUG = false } = process.env

export const splitDot = ((str: string) => {
  const [_str, name, ext] = str.match(/^(.+)\.([^\.]{1,8})$/) ?? []
  if(ext == null) {
    return { name: str }
  }
  return { name, ext }
})

export const any = (arr: Array<unknown>) => (
  !!arr.some && arr.some(() => true)
)

const mkQuery = (paths: Pathset) => {
  let count = 0
  const vars: Record<string, string> = {}
  const matches = paths.map((path) => {
    const segments = path.map((segment) => {
      if(segment === '**') {
        return `-[:CHILD*0..8]->`
      } else if(segment === '') {
        return `-[:CHILD]->`
      } else {
        vars[`segment${++count}`] = segment
        return (
          `-[c${count}:CHILD]->`
        )
      }
    })
    return `MATCH (:Root)${segments.join('()')}(res)`
  })

  const wheres = (
    Object.keys(vars).map((variable, idx) => (
      `c${idx + 1}.name = $${variable}`
    ))
  )

  let statement = `
    MATCH (res:Resource)-->(src:Source)
    ${matches.join("\n      ")}
  `
  if(wheres.length > 0) {
    statement += `WHERE ${wheres.join(' AND ')}`
  }
  statement += `\nRETURN DISTINCT src.cid as cid`

  return { statement, vars }
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | APIError>,
) => {
  const reqSesh = (
    req.session as IronSession & MeResponse
  )

  const { ens = null, siwe: { address = null } = {} } = (
    reqSesh
  )
  const pathsSpec = req.query.paths ?? req.body

  try {
    if(!pathsSpec) {
      throw new Error(
        'GET parameters should include JSON5 `paths`.'
      )
    }
    verifyNeo4j()
  } catch(error) {
    const { message } = error as Error
    res.status(422).json({ message })
    return
  }

  const paths = JSON5.parse(pathsSpec)

  if(DEBUG) console.info({ paths })

  const neo4j = Neo4j.driver(
    process.env.NEO4J_URI!,
    Neo4j.auth.basic(
      process.env.NEO4J_USERNAME!,
      process.env.NEO4J_PASSWORD!,
    ),
  )

  const db = neo4j.session({ database })
  let cids: Maybe<Array<string>> = null
  let message = null
  try {
    const { statement, vars } = mkQuery(paths)

    if(DEBUG) console.info({ statement, vars })

    const result = await db.readTransaction((tx) => (
      tx.run(statement, vars)
    ))

    cids = result.records.map(
      (rec) => rec.get('cid')
    )
  } catch(err) {
    message = (err as Error).message
  } finally {
    await db.close()
    await neo4j.close()
  }

  if(message) {
    res.status(500).json({ message })
  } else if(cids) {
    res.status(200).json({ cids })
  } else {
    res.status(500).json({ message: 'Don’t know how we got here.' })
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
