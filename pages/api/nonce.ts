import { sessionOpts } from '../../config'
import { generateNonce } from 'siwe'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { IronSession } from 'iron-session'
import { APIError, MeResponse, NonceResponse } from '../../types'


const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<string | APIError>,
) => {
  try {
    const reqSesh = (
      req.session as IronSession & NonceResponse
    )

    if(!process.env.SESSION_PASSWORD) {
      res.status(500)
      .send({
        message: '`$SESSION_PASSWORD` not configured.'
      })
    } else {
      reqSesh.nonce = generateNonce()
      await reqSesh.save()

      res.status(200)
      .send(reqSesh.nonce)
    }
  } catch(err) {
    res.status(500)
    .send({ message: (err as Error).message })
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)