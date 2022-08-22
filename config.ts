export const sessionOpts = (() => {
  const { NODE_ENV, SESSION_PASSWORD, SESSION_COOKIE_NAME } = (
    process.env
  )

  return ({
    cookieName: (
      SESSION_COOKIE_NAME ?? '𝔐𝔦̈𝔪𝔦𝔰-default'
    ),
    password: SESSION_PASSWORD ?? 'This is a password.',
    cookieOptions: {
      secure: NODE_ENV === "production",
    },
  })
})()

export const ipfsLinkPattern = (
  process.env.NEXT_PUBLIC_IPFS_LINK_PATTERN
  ?? 'https://{v1cid}.ipfs.dweb.link/{path}'
  ?? 'https://ipfs.io/ipfs/{cid}/{path}'
)
export const ipfsLimitingDelay = (
  process.env.NEXT_PUBLIC_IPFS_LIMITING_DELAY
  ?? 60 * 1000 / 95 // 95 per minute (< 100 / min which fails intermittently)
)
export const gwPatternKey = 'Mïmis-Gateway-Pattern'
export const limitingDelayKey = 'Mïmis-Gateway-Limiting-Delay'

export const ipfsAPIURL = (
  process.env.NEXT_PUBLIC_IPFS_API_URL
  ?? 'http://localhost:5001/api/v0'
)