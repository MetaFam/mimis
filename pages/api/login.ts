import { sessionOpts } from '../../config'
import { SiweMessage as SIWEMessage } from 'siwe'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { providers } from 'ethers'

const { JsonRpcProvider: JSONRPCProvider } = (
  providers
)

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<string>,
) => {
  try {
    const { message: input, signature } = req.body
    if (!input) {
      res.status(422).json({
        message: 'Expected `message` in body.'
      })
      return
    }

    const message = new SIWEMessage(input)

    const mainnetProvider = new JSONRPCProvider(
      {
        allowGzip: true,
        url: process.env.MAINNET_PROVIDER_URL,
        headers: {
          Accept: '*/*',
          // Origin: `http://localhost:${PORT}`,
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/json',
        },
      },
      1,
    )

    await ensProvider.ready

    const fields: SIWEMessage = (
      await message.validate(
        signature, mainnetProvider
      )
    )

    if(fields.nonce !== req.session.nonce) {
      await req.session.destroy()

      res.status(422).json({
        message: (
          'Invalid nonce. Session Destroyed.'
          + ' Rerequest `/nonce`.'
        ),
      })
      return
    }

    const session = {
      siwe: fields,
      nonce: null
      cookie: { expires: (
        new Date(fields.expirationTime)
      ) }
    }
    const ens = await ensProvider.lookupAddress(
      fields.address
    )
    if(ens) {
      Object.assign(session, { ens })

      const ensResolver = (
        mainnetProvider.getResolver(ens)
      )
      const avatar = await ensResolver.getAvatar()
      console.debug({ avatar })
      if(avatar) {
        session.avatar = avatar.url
      }
      const text = await ensResolver.getText('𝔐𝔦̈𝔪𝔦𝔰')
      if(text) {
        session.𝔐𝔦̈𝔪𝔦𝔰 = text
      }
    }

    Object.assign(req.session, session)
    await req.session.save()
 
    const output = {
      address: fields.address,
      ens,
    }

    console.debug({
      session, 'req.session': req.session, fields, output
    })

    res.status(200).json(output)
  } catch(err) {
    const { message } = err

    Object.assign(req.session, {
      siwe: null,
      nonce: null,
      ens: null,
    })
    await req.session.save()

    console.error({ err })

    switch(err) {
      case ErrorTypes.EXPIRED_MESSAGE: {
        res.status(440).json({ message })
        break
      }
      case ErrorTypes.INVALID_SIGNATURE: {
        res.status(422).json({ message })
        break
      }
      default: {
        res.status(500).json({ message })
        break
      }
    }
  }
}

export default withIronSessionApiRoute(
  handler, sessionOpts
)