<script lang="ts">
  import { createSiweMessage } from 'viem/siwe'
  import { getConnection, signMessage } from '@wagmi/core'
  import { onMount } from 'svelte'
  import { error } from '@sveltejs/kit'
  import type { AppKit } from '@reown/appkit'
  import { browser } from '$app/environment'
  import { logout } from '$lib/remotes/logout.remote'
  import { whoami } from '$lib/remotes/whoami.remote'
  import settings from '$lib/settings.svelte'

  let {
    walletConnected = $bindable(false),
    me = $bindable<string | null>(null)
  } = $props()
  let wagmiConfig: ReturnType<
    typeof import('$lib/appkit').getWagmiAdapter
  >['wagmiConfig'] | null = null
  let appKit: AppKit | null = null

  onMount(() => {
    connect().catch((err) => {
      console.error({ 'AppKit Connection Error': err })
    })
  })

  async function connect() {
    const { getAppKit, getWagmiAdapter } = await import('$lib/appkit')
    appKit = getAppKit()
    ;({ wagmiConfig } = getWagmiAdapter())
    let signingIn = false

    walletConnected = !!appKit.getIsConnectedState()
    appKit.subscribeEvents(async () => {
      walletConnected = !!appKit?.getIsConnectedState()
      if(!walletConnected) {
        if(me) { // was previously authenticated
          await logout()
        }
        me = null
      } else if(!me) {
        if(!wagmiConfig) throw new Error('WAGMI Config Not Available')
        const { address: localAddr = null, isConnected } = (
          getConnection(wagmiConfig)
        )
        if(isConnected) {
          const remoteAddr = await whoami()
          if(remoteAddr?.toLowerCase() === localAddr?.toLowerCase()) {
            me = localAddr ?? null
          } else {
            me = null
          }
          console.debug({ me, remoteAddr, localAddr })
        }
      }
      if(wagmiConfig && walletConnected && !me && !signingIn) {
        signingIn = true
        me = await siweSignIn() ?? null
        signingIn = false
      }
    })
  }

  async function siweSignIn() {
    if(!wagmiConfig) throw new Error('WAGMI config not available.')
    const account = getConnection(wagmiConfig)
    if(settings.debugging) {
      console.debug({ 'SIWE Attempt': {
        address: account.address,
        status: account.status,
      } })
    }
    if(!account.address) return

    try {
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address }),
      })
      const { nonce } = await nonceRes.json() as { nonce: string }

      const message = createSiweMessage({
        domain: window.location.host,
        address: account.address,
        statement: 'Sign in to Mïmis.',
        uri: window.location.origin,
        version: '1',
        chainId: account.chainId ?? 1,
        nonce,
      })

      const signature = await signMessage(wagmiConfig, { message })

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })
      if(verifyRes.ok) {
        return account.address
      } else {
        const msg = (
          verifyRes.statusText
          || 'Unknown error during SIWE verification.'
        )
        console.error({ 'SIWE Verification Failed': msg })
        throw error(500, `Sign-in failed: "${msg}"`)
      }
    } catch(err) {
      console.error({ 'SIWE Sign-In Error': err })
      throw error(500, `'SIWE Sign-In Error:': "${(err as Error).message}"`)
    }
  }
</script>

{#if browser && walletConnected}
  <appkit-button network="eip155"></appkit-button>
{:else}
  <button onclick={() => appKit?.open()}>Connect Wallet</button>
{/if}
