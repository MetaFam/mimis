import { sessionOpts } from '../../config'
import { generateNonce } from 'siwe'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'


const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<string>,
) => {
  if(!process.env.SESSION_PASSWORD) {
    res.status(500)
    .send('$SESSION_PASSWORD not configured.')
  } else {
    req.session.nonce = generateNonce()
    await req.session.save()

    res.status(200)
    .send(req.session.nonce)
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)