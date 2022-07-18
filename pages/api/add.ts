import { sessionOpts } from '../../config'
import { APIError, MeResponse } from '../../types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import JSON5 from 'json5'

const client = ipfsHttpClient({ url: process.env.IPFS_URL })

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

  const { cid } = JSON5.parse(req.body)

  console.info({ cid, b: req.body })

  if(!cid) {
    res.status(422)
    .json({ message: 'Request body should include `cid`.' })
    
    return
  }

  for await (const entry of client.get(cid, { archive: false })) {
    console.info({ entry })
  }

  res.status(200)
  .json({
    address: reqSesh.siwe.address,
    ens: reqSesh.ens ?? undefined,
    avatar: reqSesh.avatar,
  })
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
