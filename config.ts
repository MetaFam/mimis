export const sessionOpts = (() => {
  const { NODE_ENV, SESSION_PASSWORD, SESSION_COOKIE_NAME } = (
    process.env
  )

  if(!SESSION_PASSWORD) {
    throw new Error(
      'Missing: `$SESSION_PASSWORD` to encrypt session store.'
    )
  }

  return ({
    cookieName: (
      SESSION_COOKIE_NAME ?? '𝔐𝔦̈𝔪𝔦𝔰-default'
    ),
    password: SESSION_PASSWORD,
    cookieOptions: {
      secure: NODE_ENV === "production",
    },
  })
})()