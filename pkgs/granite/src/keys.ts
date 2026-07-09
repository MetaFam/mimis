import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import type { Address } from './codec.ts'

export const generateKey = (): `0x${string}` => (
  generatePrivateKey()
)

export const addressOf = (key: `0x${string}`): Address => (
  privateKeyToAccount(key).address.toLowerCase() as Address
)
