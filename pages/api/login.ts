import { sessionOpts } from '../../config'
import { ErrorTypes, SiweMessage as SIWEMessage } from 'siwe'
import {
  withIronSessionApiRoute
} from 'iron-session/next'
import type {
  NextApiRequest, NextApiResponse,
} from 'next'
import { providers } from 'ethers'
import { APIError, LoginResponse, Maybe } from '../../types'
import { IronSession } from 'iron-session'

const { JsonRpcProvider: JSONRPCProvider } = (
  providers
)

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | APIError>,
) => {
  const reqSesh = req.session as IronSession & {
    nonce: string
    expirationTime: number
  }

  try {
    const { message: input, signature } = req.body
    if (!input) {
      res.status(422).json({
        message: 'Expected `message` in body.'
      })
      return
    }

    const message = new SIWEMessage(input)

    if(!process.env.MAINNET_PROVIDER_URL) {
      res.status(500).json({
        message: (
          'Missing `$MAINNET_PROVIDER_URL`. Configure server.'
        ),
      })
      return
    }

    const mainnetProvider = new JSONRPCProvider(
      {
        allowGzip: true,
        url: process.env.MAINNET_PROVIDER_URL,
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Content-Type': 'application/json',
        },
      },
      1,
    )

    await mainnetProvider.ready

    const siwe: SIWEMessage = (
      await message.validate(
        signature, mainnetProvider
      )
    )

    if(siwe.nonce !== reqSesh.nonce) {
      await reqSesh.destroy()

      res.status(422).json({
        message: (
          'Invalid nonce. Session Destroyed.'
          + ` Got ${siwe.nonce}; wanted ${reqSesh.nonce}.`
          + ' Rerequest `/nonce`.'
        ),
      })
      return
    }

    const session: {
      siwe: SIWEMessage,
      nonce: Maybe<string>,
      cookie: { expires: Date },
      avatar?: string,
      '𝔐𝔦̈𝔪𝔦𝔰'?: string
    } = {
      siwe,
      nonce: null,
      cookie: {
        expires: (
          new Date(Number(siwe.expirationTime))
        )
      },
    }
    const ens = await mainnetProvider.lookupAddress(
      siwe.address
    )
    if(ens) {
      Object.assign(session, { ens })

      // const ensResolver = (
      //   await mainnetProvider.getResolver(ens)
      // )
      // if(ensResolver) {
      //   const avatar = await ensResolver.getAvatar()
      //   console.debug({ avatar })
      //   if(avatar) {
      //     session.avatar = avatar.url
      //   }
      // }
    }

    Object.assign(reqSesh, session)
    await reqSesh.save()
 
    const output = {
      address: siwe.address,
      ens,
    }

    console.debug({
      session, reqSesh, siwe, output
    })

    res.status(201).json(output)
  } catch(err) {
    const { message } = err as Error

    Object.assign(reqSesh, {
      siwe: null,
      nonce: null,
      ens: null,
    })
    await reqSesh.save()

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