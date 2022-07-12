import { sessionOpts } from '../../config'
import { SiweMessage as SIWEMessage } from 'siwe'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { providers } from 'ethers'

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<string>,
) => {
  try {
    const { ens, message: input, signature } = req.body
    if (!input) {
      res.status(422).json({ message: 'Expected message object in body.' })
      return
    }

    const message = new SIWEMessage(input)

    const ensProvider = new providers.JsonRpcProvider(
      {
        allowGzip: true,
        url: process.env.ENS_PROVIDER_URL,
        headers: {
          Accept: '*/*',
          // Origin: `http://localhost:${PORT}`,
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/json',
        },
      },
      1,
    )

    await infuraProvider.ready

    const fields: SIWEMessage = (
      await message.validate(signature, ensProvider)
    )

    if (fields.nonce !== req.session.nonce) {
      res.status(422).json({
        message: 'Invalid nonce.',
      })
      return
    }

    req.session.siwe = fields
    req.session.ens = ens
    req.session.nonce = null
    req.session.cookie.expires = (
      new Date(fields.expirationTime)
    )
    await req.session.save()
    
    res.status(200)
    .json({
      address: fields.address,
      ens: req.session.ens,
            })
            .end(),
    );
} catch (e) {
    req.session.siwe = null;
    req.session.nonce = null;
    req.session.ens = null;
    console.error(e);
    switch (e) {
        case ErrorTypes.EXPIRED_MESSAGE: {
            req.session.save(() => res.status(440).json({ message: e.message }));
            break;
        }
        case ErrorTypes.INVALID_SIGNATURE: {
            req.session.save(() => res.status(422).json({ message: e.message }));
            break;
        }
        default: {
            req.session.save(() => res.status(500).json({ message: e.message }));
            break;
        }
    }
}
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)