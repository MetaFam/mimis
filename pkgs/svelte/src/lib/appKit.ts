import { createAppKit } from '@reown/appkit'
import { mainnet, type Chain } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit-common'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { PUBLIC_APPKIT_PROJECT_ID } from '$env/static/public'
import {
  createConfig as createWAGMIConfig,
  createStorage as createWAGMIStorage,
  http,
  injected,
} from '@wagmi/core'

export type AppKitModal = ReturnType<typeof createAppKit>

export const defaultNetworks = [mainnet]

let modal: AppKitModal | null = null
export function getAppKitModal(networks = defaultNetworks) {
  if(modal == null) {
    const wagmiAdapter = new WagmiAdapter({
      projectId: PUBLIC_APPKIT_PROJECT_ID,
      networks
    })
    const metadata = {
      name: 'Mïmis',
      description: 'Collaborative filesystem',
      url: 'https://mimis.dhappy.org',
      icons: ['https://avatars.githubusercontent.com/u/179229932']
    }
    modal = createAppKit({
      adapters: [wagmiAdapter],
      networks: networks as unknown as [AppKitNetwork, ...Array<AppKitNetwork>],
      metadata,
      projectId: PUBLIC_APPKIT_PROJECT_ID,
      features: {
        analytics: true,
        swaps: false,
        onramp: false,
        connectMethodsOrder: ['wallet', 'social', 'email'],
      },
    })
  }
  return modal
}

export function getWAGMIConfig(networks = defaultNetworks) {
  return createWAGMIConfig({
    chains: networks as unknown as [Chain, ...Array<Chain>],
    connectors: [injected()],
    storage: createWAGMIStorage({ storage: window.localStorage }),
    transports: Object.fromEntries(networks.map(({ id }) => (
      [id, http()]
    ))),
  })
}