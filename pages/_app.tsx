import type { AppProps } from 'next/app'
import { chakra, ChakraProvider, Flex, Heading, Image, Link } from '@chakra-ui/react'
import { LoginButton, PermaOptions } from '../components'
import Head from 'next/head'

export const Forest = (
  ({ Component, pageProps }: AppProps) => (
    <ChakraProvider>
      <Head>
        <meta
          name="description"
          content="Context forest filesystem"
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <chakra.header my={2}>
        <Link href="/">
          <Flex justify="center" align="center">
            <Image
              src="logo.svg"
              alt="Logo"
              maxH="5vh"
            />
            <Heading fontSize="4vh" m={0} ml={10}>
              𝔐𝔦̈𝔪𝔦𝔰
            </Heading>
          </Flex>
        </Link>
        <LoginButton
          position="fixed"
          right="0.25vw" top="0.25vw"
        />
        <PermaOptions
          position="fixed"
          right="2vw" top="20vh"
        />
      </chakra.header>

      <Component {...pageProps} />

      <chakra.footer
        position="fixed"
        bottom={0}
        w="full"
        textAlign="center"
      >
        Developed July 2022 for
        <Link
          ml={1}
          borderBottom="1px dashed"
          _hover={{ borderBottom: '1px solid' }}
          href="//fs.ethglobal.com"
        >HackFS</Link>.
      </chakra.footer>
    </ChakraProvider>
  )
)

export default Forest