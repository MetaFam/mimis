import { sessionOpts } from '@/config'
import { APIError, MeResponse } from '@/types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session';

type NamedAddress = {
  address: string
  ens?: string
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
