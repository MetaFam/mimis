#!/usr/bin/env -S node --experimental-strip-types
// Compiles contracts/GraniteRegistry.sol with solc-js and deploys it to
// the configured RPC (anvil by default), printing the deployed address.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import solc from 'solc'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// anvil's first default account
const defaultKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

export const compileRegistry = (): { abi: unknown[], bytecode: `0x${string}` } => {
  const path = fileURLToPath(new URL('../contracts/GraniteRegistry.sol', import.meta.url))
  const input = {
    language: 'Solidity',
    sources: {
      'GraniteRegistry.sol': { content: readFileSync(path, 'utf8') },
    },
    settings: {
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  }
  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  const failures = (output.errors ?? []).filter(
    (error: { severity: string }) => error.severity === 'error',
  )
  if(failures.length > 0) {
    throw new Error(failures.map((error: { formattedMessage: string }) => (
      error.formattedMessage
    )).join('\n'))
  }
  const contract = output.contracts['GraniteRegistry.sol'].GraniteRegistry
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}` as `0x${string}`,
  }
}

export const deployRegistry = async (
  rpcUrl: string, key: `0x${string}` = defaultKey,
): Promise<`0x${string}`> => {
  const { abi, bytecode } = compileRegistry()
  const account = privateKeyToAccount(key)
  const wallet = createWalletClient({ account, transport: http(rpcUrl) })
  const client = createPublicClient({ transport: http(rpcUrl) })
  const hash = await wallet.deployContract({
    chain: null,
    abi: abi as [],
    bytecode,
  })
  const receipt = await client.waitForTransactionReceipt({ hash })
  if(!receipt.contractAddress) {
    throw new Error('deployment produced no contract address')
  }
  return receipt.contractAddress
}

if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const rpcUrl = process.env.GRANITE_RPC_URL ?? 'http://127.0.0.1:8545'
  const key = (process.env.GRANITE_DEPLOY_KEY ?? defaultKey) as `0x${string}`
  deployRegistry(rpcUrl, key).then((address) => {
    console.log(address)
  }).catch((error) => {
    console.error(String(error?.message ?? error))
    process.exit(1)
  })
}
