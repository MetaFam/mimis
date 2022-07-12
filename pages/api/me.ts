import { sessionOpts } from '../../config'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'

type NamedAddress = {
  address: string
  ens: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<NamedAddress>,
) => {
  if (!req.session.siwe) {
    res.status(401)
    .json({ message: 'You have to login.' })
    
    return
  }
  res.status(200)
  .json({
      address: req.session.siwe.address,
      ens: req.session.ens,
  })
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)
