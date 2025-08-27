import { create as generateStoracha } from '@storacha/client'
import type { EmailAddress } from '@storacha/client/types'
import { settings } from './settings.svelte.ts'
import type { Logger } from '../types'

export async function createStoracha(
  { auth, log }:
  { auth?: boolean, log?: Logger } = {}
) {
  const { storachaEmail: email, storachaSpace: space } = (
    settings
  )
  if(!email) {
    throw new Error('No Storacha email specified in settings.')
  }
  if(!space) {
    throw new Error('No Storacha space name specified in settings.')
  }
  const storacha = await generateStoracha()

  log?.(`Awaiting confirmation on ${email}. Check your messages.`)
  const account = await storacha.login(
    email as EmailAddress
  )
  log?.(`Connected as "${email}".`)

  let meta: { did: () => `did:${string}:${string}` } | undefined = (
    storacha.spaces().find((s) => s.name === space)
  )
  if(meta) {
    log?.(`Found existing Storacha space: "${space}" (${meta.did()}).`)
  } else {
    meta = await storacha.createSpace(space, { account })
    if(meta) {
      log?.(`Created Storacha space: "${space}" (${meta.did()}).`)
    }
  }
  if(!meta) {
    throw new Error(`Couldn’t find or create space: "${space}".`)
  }
  await storacha.setCurrentSpace(meta.did())

  return storacha
}