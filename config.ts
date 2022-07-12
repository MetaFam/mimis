export const sessionOpts = {
  cookieName: process.env.SESSION_COOKIE_NAME,
  password: process.env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
}