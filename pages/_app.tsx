import '../styles/globals.css'
import type { AppProps } from 'next/app'

export const Forest = (
  ({ Component, pageProps }: AppProps) => (
    <Component {...pageProps} />
  )
)

export default Forest