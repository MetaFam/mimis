import type { AppProps } from 'next/app'
import {
  chakra, ChakraProvider, Flex, Heading, Image, Link,
} from '@chakra-ui/react'
import { LoginButton, PermaOptions } from '@/components'
import Head from 'next/head'
import { Settings } from '@/lib/SettingsContext';

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

      <Settings>
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
        </chakra.header>

        <chakra.main>
          <PermaOptions
            position="fixed"
            right="2vw" top="20vh"
          />
          <Component {...pageProps} />
        </chakra.main>

        <chakra.footer
          position="fixed"
          bottom={0}
          w="full"
          textAlign="center"
        >
          <Flex
            display="inline-block"
            bg="#FFFFFFBB"
            mx="auto" px={2}
            borderRadius={5}
          >
            Developed July 2022 for
            <Link
              ml={1}
              borderBottom="1px dashed"
              _hover={{ borderBottom: '1px solid' }}
              href="//ethglobal.com/showcase/mimis-zd5sn"
            >HackFS</Link>.
          </Flex>
        </chakra.footer>
      </Settings>
    </ChakraProvider>
  )
)

export default Forest