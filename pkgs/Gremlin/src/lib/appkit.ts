import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { browser } from '$app/environment'
import { env } from '$env/dynamic/public'

export const appKit = (!browser ? null : ((() => {
  const projectId = env.PUBLIC_APPKIT_PROJECT_ID
  if(!projectId) {
    throw new Error('$PUBLIC_APPKIT_PROJECT_ID is not set.')
  }

  const networks = [mainnet]

  const wagmiAdapter = new WagmiAdapter({ networks, projectId })
  return createAppKit({
    adapters: [wagmiAdapter],
    networks: [mainnet],
    projectId,
    metadata: {
      name: 'SvelteKit Example',
      description: 'SvelteKit Example using Wagmi adapter',
      url: import.meta.env.DEV ? 'http://localhost:5173' : 'https://mimis.dhappy.org',
      icons: ['https://avatars.githubusercontent.com/u/179229932?s=200&v=4'],
    }
  })
})()))

export default appKit