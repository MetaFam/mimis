import { sessionOpts } from '../../config'
import { APIError, MeResponse, Path, Pathset } from '../../types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session'
import { CID, create as ipfsHTTPClient, IPFSHTTPClient } from 'ipfs-http-client'
import JSON5 from 'json5'
import neo4j from 'neo4j-driver'

    // const bytes = crypto.randomBytes(
    //   42 + Math.round(Math.random() * 50)
    // )
    // const key = bytes.toString('base64')

    // const query = `
    //   MATCH (n)
    //   RETURN COUNT(n) AS count
    // `
    // const params = { key }

    // const result = await db.run(query, params)

    // result.records.forEach((record) => {
    //   console.log(record.get('count'));
    // })


const mkResource = async (
  { db, paths, cid }:
  { db: any, paths: Pathset, cid: CID }
) => {
  console.info({ paths: paths.join('/'), cid })
}

const mkLink = async (
  { db, paths, destination }:
  { db: any, paths: Pathset, destination: Path }
) => {
  await Promise.all(paths.map((path: Path) => {
    console.info(`ln -s ${path.join('―')} ${destination.join('―')}`)
  }))
}

const intake = async (
  { db, ipfs, cid, path = [] }:
  {
    ipfs: IPFSHTTPClient
    cid: string
    path?: Path
    db: any
  }
) => {
  for await (const entry of ipfs.ls(cid)) {
    const resource = [...path, entry.name]
    const isDir = entry.type === 'dir'
    let isLink = false
    if(isDir) {
      await intake({
        db,
        ipfs,
        cid: entry.cid.toString(),
        path: resource })
    } else if(entry.size < 250) {
      for await (const link of ipfs.cat(entry.cid)) {
        const maybeRef = link.toString()
        if(isLink = !/[<\n]/.test(maybeRef)) { // symlink?
          const path = maybeRef.split('/')
          await mkLink({
            db,
            paths: [resource],
            destination: path,
          })
        }
      }
    }
    if(!isDir && !isLink) {
      await mkResource({
        db, paths: [resource], cid: entry.cid
      })
    }
  }

}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MeResponse | APIError>,
) => {
  const reqSesh = (
    req.session as IronSession & MeResponse
  )

  if (!reqSesh.siwe) {
    res.status(401)
    .json({ message: 'You have to login.' })

    return
  }

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

  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME!,
      process.env.NEO4J_PASSWORD!,
    ),
    {/* encrypted: 'ENCRYPTION_OFF' */},
  )
  const db = driver.session({
    database: process.env.NEO4J_DATABASE!,
  })

  try {
    const ipfs = ipfsHTTPClient({ url })

    intake({ db, ipfs, cid })

    res.status(200)
    .json({
      address: reqSesh.siwe.address,
      ens: reqSesh.ens ?? undefined,
      avatar: reqSesh.avatar,
    })
  } finally {
    db.close()
    driver.close()
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
