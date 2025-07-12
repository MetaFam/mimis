import { createAppKit } from '@reown/appkit'
import { mainnet } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { PUBLIC_APPKIT_PROJECT_ID } from '$env/static/public'

export const networks = [mainnet]

export const adapter = new WagmiAdapter({
  projectId: PUBLIC_APPKIT_PROJECT_ID,
  networks
})

export const { wagmiConfig } = adapter

export const metadata = {
  name: 'Mïmis',
  description: 'Collaborative filesystem',
  url: 'https://mimis.dhappy.org',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

export const appKit = createAppKit({
  adapters: [adapter],
  networks,
  metadata,
  projectId: PUBLIC_APPKIT_PROJECT_ID,
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
    connectMethodsOrder: ['wallet', 'social', 'email'],
  },
})

