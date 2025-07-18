<script lang="ts">
  import JSON5 from 'json5'
  import { createAppKit, type Provider, type UseAppKitAccountReturn } from '@reown/appkit'
  import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
  import { mainnet } from '@wagmi/core/chains'
  import type { AppKitNetwork, ChainNamespace } from '@reown/appkit-common'
  import { PUBLIC_APPKIT_PROJECT_ID } from '$env/static/public'

  const logs: Array<string | {}> = $state([])
  function log(msg: string | {}) {
    console.debug({ msg })
    if(typeof msg !== 'string') {
      try {
        msg = JSON5.stringify(msg, null, 2)
      } catch(error) {
        msg = `Error: ${(error as Error).message}`
      }
    }
    logs.unshift(msg)
  }

  const networks = [mainnet] as [AppKitNetwork]

  const adapter = new WagmiAdapter({
    projectId: PUBLIC_APPKIT_PROJECT_ID,
    networks
  })

  const metadata = {
    name: 'Mïmis',
    description: 'Collaborative filesystem',
    url: 'https://mimis.dhappy.org',
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  }

  const appKit = $state(createAppKit({
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
  }))

  async function getProvider(network: ChainNamespace = 'eip155') {
    await appKit.ready()
    return new Promise(
      (resolve: ((prov: Provider) => void), reject) => {
        const provider: Provider | undefined = (
          appKit.getProvider(network)
        )
        if(provider) {
          return resolve(provider)
        }
        appKit.subscribeProviders(
          (provs) => resolve(provs[network] as Provider)
        )
        appKit.subscribeEvents((evt) => {
          if(evt.data.event === 'MODAL_CLOSE') {
            if(!evt.data.properties.connected) {
              reject(new Error('Modal closed without connection.'))
            }
          }
        })
        appKit.open()
      }
    )
  }

  const providerSign = async (evt: MouseEvent) => {
    try {
      const message= 'This is a test.'
      const provider: Provider = await getProvider()
      // provider = appKit.getUniversalProvider()
      // provider = appKit.getWalletProvider() as Provider
      let { address } = (
        appKit.getAccount() as { address?: string }
      )
      if(!address) {
        address = await new Promise(
          (resolve: ((arg: string) => void)) => {
            appKit.subscribeAccount(({ address }) => {
              if(address) {
                resolve(address)
              }
            })
            appKit.open()
          }
        )
      }

      log({ message, provider, address })
      if(!address) throw new Error('Could not find address from provider.')

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message,  address]
      })
      log({ signature })
    } catch(error) {
      log(`Error: ${(error as Error).message}`)
    }
  }
</script>

<svelte:head>
  <title>Mïmis: Serialize</title>
  <link rel="icon" href="radioactive%20barrel.svg"/>
</svelte:head>

<main>
  <button onclick={providerSign}>Provider <code>sign_message</code></button>

  <appkit-button />

  <ol reversed>
    {#each logs as message}
      <li><pre>{message}</pre></li>
    {/each}
  </ol>
</main>

<style>
  main {
    margin-block-start: min(25vh, 15rem);
    display: grid;
    place-items: center;
  }

  button {
    max-width: max-content;
    margin-inline: auto;
    margin-block: 0.5rem;
  }
</style>
