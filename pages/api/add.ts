import { sessionOpts } from '../../config'
import { AddResponse, APIError, Maybe, MeResponse, Path, Pathset } from '../../types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session'
import {
  CID, create as ipfsHTTPClient, IPFSHTTPClient
} from 'ipfs-http-client'
import JSON5 from 'json5'
import Neo4j, { Driver } from 'neo4j-driver'

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

export const setUUIDs = async (
  { neo4j, label }: { neo4j: Driver, label: string}
) => {
  let db = neo4j.session({ database })
  try {
    await db.run(`
      CREATE CONSTRAINT IF NOT EXISTS ON (a:${label})
      ASSERT a.uuid IS UNIQUE
    `)
  } catch(err) {
    console.error((err as Error).message)
  } finally {
    await db.close()
  }

  // This hangs when run against the Sandbox.

  // db = neo4j.session({ database })
  // try {
  //   await db.run(`
  //     CALL apoc.uuid.install("${label}", { addToExistingNodes: true })
  //   `)
  // } catch(err) {
  //   console.error((err as Error).message)
  // } finally {
  //   await db.close()
  // }
}

const mkImport = async (
  { neo4j, ens, address }:
  {
    neo4j: Driver
    ens: Maybe<string>
    address: string
  }
) => {
    const query = `
      MERGE (u:User)-[imp:IMPORTED]->(dir:Directory)
      ON CREATE SET
        u.ens = $ens,
        u.ethAddress = $address,
        imp.at = localdatetime(),
        dir.uuid = apoc.create.uuid()
      RETURN dir.uuid as uuid
    `
    const params = { ens, address }

    const db = neo4j.session({ database })
    try {
      if(DEBUG) console.info({ query, params })

      const result = await db.run(query, params)

      if(result.records.length !== 1) {
        console.warn(
          `Returned ${result.records.length} root directories.`
        )
      }

      return result.records[0].get('uuid')
    } catch(err) {
      console.error((err as Error).message)
      return null
    } finally {
      await db.close()
    }
}

const mkResource = async (
  { neo4j, rootId, paths, cid }:
  {
    neo4j: Driver
    rootId: string
    paths: Pathset
    cid: CID
  }
) => {
  await Promise.all(paths.map(async (path) => {
    let [last] = path.slice(-1)
    const { name, ext } = splitDot(last)

    if(name && ext) {
      path.pop()
      const newPath = [name]
      if(name !== ext) { // svg.svg files exist
        newPath.push(ext)
      }
      path.push(...newPath)
    }

    [last] = path.slice(-1)
    const children = path.slice(0, -1).map(
      (_segment, idx) => (
        `MERGE (d${idx})-[c${idx + 1}:CHILD { name: $name${idx + 1} }]->(d${idx + 1}:Directory)`
      )
    )
    children.push(
      `MERGE
        (d${path.length - 1})
        -[
          c${path.length}:CHILD
          { name: $name${path.length} }
        ]->
        (r1:Resource)`
    )

    const ds = path.slice(0, -1).map(
      (_segment, idx) => (
        `d${idx + 1}.uuid = apoc.create.uuid()`
      )
    )

    const query = `
      MATCH (d0:Directory { uuid: $rootId })
      ${children.join("\n      ")}
      MERGE (src:Source { cid: $cid })
      MERGE (r1)-[ref:REFERENCES]->(src)
      ON CREATE SET
        ${ds.join(', ')},
        r1.uuid = apoc.create.uuid(),
        ref.order = 1
      RETURN null
    `

    const params: Record<string, unknown> = {
      rootId, cid: cid.toString()
    }
    Object.assign(params, Object.fromEntries(
      path.map((segment, idx) => [
        `name${idx + 1}`, segment
      ])
    ))

    if(DEBUG) console.info({ query, params })

    const db = neo4j.session({ database })
    try {
      await db.run(query, params)
    } catch(err) {
      console.error((err as Error).message)
    } finally {
      await db.close()
    }
  }))
}

const mkLink = async (
  { neo4j, rootId, paths, destination }:
  {
    neo4j: Driver
    rootId: string
    paths: Pathset
    destination: Path
  }
) => {
  await Promise.all(paths.map(async (path: Path) => {
    let front
    const work = { in: [...path], out: [...destination] }
    do {
      front = work.out.shift()
      if(front === '..') {
        work.in.pop()
      }
    } while(front && ['.', '..'].includes(front))

    if(front) {
      work.out.unshift(front)
    }

    const ext = Object.fromEntries(
      Object.entries(work).map(
        ([direction, path]: [PropertyKey, Path]) => {
          if(any(path)) {
            const { name, ext } = splitDot(path.pop() as string)
            path.push(name)
            return [direction, ext]
          }
          return null
        }
      )
      .filter((elem) => !!elem) as Array<[PropertyKey, string]>
    )

    if(ext.in !== ext.out) {
      Object.entries(ext).forEach(([direction, ext]) => {
        work[direction as 'in' | 'out'].push(ext)
      })
    }

    const children = work.in.map(
      (_segment, idx) => (
        `MERGE (d${idx})-[c${idx + 1}:CHILD { name: $name${idx + 1} }]->(d${idx + 1}:Directory)`
      )
    )

    const db = neo4j.session({ database })
    try {
      const query = `
        MATCH (d0:Directory { uuid: $rootId })
        ${children.join("\n        ")}
        MERGE
          (d${work.in.length - 1})
          -[c${work.in.length + 1}:CHILD { name: $name${work.in.length + 1} }]->
          (d${work.in.length})
        RETURN null
      `
      const [last] = work.out.slice(-1)
      const params = {
        rootId, [`name${work.in.length + 1}`]: last
      }
      Object.assign(params, Object.fromEntries(
        work.in.map((segment, idx) => [
          `name${idx + 1}`, segment
        ])
      ))

      if(DEBUG) console.info({ query, params })

      await db.run(query, params)
    } catch(err) {
      console.error((err as Error).message)
    } finally {
      await db.close()
    }
  }))
}

const intake = async (
  { neo4j, ipfs, rootId, cid, path = [], ens, address, count = 0 }:
  {
    neo4j: Driver
    ipfs: IPFSHTTPClient
    rootId: string
    cid: CID | string
    path?: Path
    ens: Maybe<string>
    address: string
    count?: number
  }
) => {
  for await (const entry of ipfs.ls(cid)) {
    count++

    const resource = [...path, entry.name]

    const isDir = entry.type === 'dir'
    let isLink = false

    if(isDir) {
      count += await intake({
        neo4j,
        ipfs,
        rootId,
        cid: entry.cid,
        path: resource,
        ens,
        address,
      })
    } else if(entry.size < 250) {
      for await (const link of ipfs.cat(entry.cid)) {
        const maybeRef = link.toString()
        if(isLink = !/[<\n]/.test(maybeRef)) { // symlink?
          const path = maybeRef.split('/')
          await mkLink({
            neo4j,
            rootId,
            paths: [resource],
            destination: path,
          })
        }
      }
    }
    if(!isDir && !isLink) {
      await mkResource({
        neo4j,
        rootId,
        paths: [resource],
        cid: entry.cid,
      })
    }
  }
  return count
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AddResponse | APIError>,
) => {
  const reqSesh = (
    req.session as IronSession & MeResponse
  )

  if (!reqSesh.siwe) {
    res.status(401)
    .json({ message: 'You have to login.' })

    return
  }

  const { ens = null, siwe: { address } } = reqSesh
  const { cid, endpoint: url } = JSON5.parse(req.body)

  if(!cid || cid.trim() === '') {
    res.status(422)
    .json({ message: 'Request body should include `cid`.' })

    return
  }
  if(!url || url.trim() === '') {
    res.status(422)
    .json({ message: 'Request body should include `endpoint`.' })

    return
  }

  const vars = [
    'NEO4J_URL',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'NEO4J_DATABASE',
  ]
  for(const variable of vars) {
    if(!process.env[variable]) {
      res.status(422).json({
        message: `\`\$${variable}\` unspecified.`
      })
      return
    }
  }

  const neo4j = Neo4j.driver(
    process.env.NEO4J_URL!,
    Neo4j.auth.basic(
      process.env.NEO4J_USERNAME!,
      process.env.NEO4J_PASSWORD!,
    ),
    { encrypted: 'ENCRYPTION_OFF' },
  )

  try {
    await setUUIDs({ neo4j, label: 'Directory' })

    const rootId = await mkImport({ neo4j, ens, address })

    const ipfs = ipfsHTTPClient({ url })

    const count = await intake({
      neo4j, ipfs, rootId, cid, ens, address
    })

    res.status(200).json({ count })
  } finally {
    await neo4j.close()
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
