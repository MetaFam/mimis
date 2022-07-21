import { sessionOpts } from '../../config'
import { APIError, LogoutResponse, MeResponse } from '../../types'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session';

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse | APIError>,
) => {
  const reqSesh = (
    req.session as IronSession & MeResponse
  )

  if (!reqSesh.siwe) {
    res.status(401)
    .json({ message: 'You have to login.' })
    
    return
  }

  await reqSesh.destroy()

  res.status(201)
  .json({
    success: true,
  })
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
