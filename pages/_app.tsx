import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'

export const Forest = (
  ({ Component, pageProps }: AppProps) => (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  )
)

export default Forest