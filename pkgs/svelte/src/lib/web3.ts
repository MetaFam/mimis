import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { Provider } from '@reown/appkit-controllers'
import { mainnet } from '@reown/appkit/networks'
import type { AppKitNetwork, ChainNamespace } from '@reown/appkit-common'
import { dev } from '$app/environment'

export type Logger = (msg: string | {}) => void

import { PUBLIC_APPKIT_PROJECT_ID } from '$env/static/public'

class WebThreeUtils {
  networks = [mainnet] as [AppKitNetwork]

  adapter = new WagmiAdapter({
    projectId: PUBLIC_APPKIT_PROJECT_ID,
    networks: this.networks,
  })
  metadata = {
    name: 'Mïmis',
    description: 'Collaborative filesystem',
    url: !dev ? 'https://mimis.dhappy.org' : `http://localhost:5173`,
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  }
  #appKit: ReturnType<typeof createAppKit> | null = null

  get appKit() {
    if(!this.#appKit) {
      this.#appKit = createAppKit({
        adapters: [this.adapter],
        networks: this.networks,
        metadata: this.metadata,
        projectId: PUBLIC_APPKIT_PROJECT_ID,
        features: {
          analytics: true,
          swaps: false,
          onramp: false,
          connectMethodsOrder: ['wallet', 'social', 'email'],
        },
      })
    }
    return this.#appKit
  }

  async getProvider(
    network: ChainNamespace = 'eip155',
    { log }: { log?: Logger } = {},
  ) {
    await this.appKit.ready()
    const provider = new Promise(
      (resolve: ((prov: Provider) => void), reject) => {
        const provider: Provider | undefined = (
          this.appKit.getProvider(network)
        )
        if(provider) {
          log?.({ 'AppKit Provider': provider })
          return resolve(provider)
        }
        this.appKit.subscribeProviders(
          (provs) => resolve(provs[network] as Provider)
        )
        this.appKit.subscribeEvents((evt) => {
          if(evt.data.event === 'MODAL_CLOSE') {
            if(!evt.data.properties.connected) {
              reject(new Error('Modal closed without connection.'))
            }
          }
        })
        this.appKit.open()
      }
    )
    log?.({ 'Promised Provider': provider })
    return provider
  }

  async signMessage(
    message: string, { log }: { log?: Logger } = {}
  ) {
    const provider: Provider = (
      await this.getProvider(undefined, { log })
    )
    let { address } = (
      this.appKit.getAccount() as { address?: string }
    )
    if(!address) {
      address = await new Promise(
        (resolve: ((arg: string) => void)) => {
          this.appKit.subscribeAccount(({ address }) => {
            if(address) {
              resolve(address)
            }
          })
          this.appKit.open()
        }
      )
    }

    log?.({ message, provider, address })
    if(!address) throw new Error(
      'Could not find address from provider.'
    )

    return await provider.request({
      method: 'personal_sign',
      params: [message,  address]
    })
  }
}

export const Web3 = new WebThreeUtils()