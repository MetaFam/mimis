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
  process.env.IPFS_LINK_PATTERN
  ?? 'https://{v1cid}.ipfs.dweb.link/{path}'
  ?? 'https://ipfs.io/ipfs/{cid}/{path}'
)