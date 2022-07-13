import {
  chakra, Container, Flex, Heading, Image, Link as ChakraLink,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import NextLink from 'next/link'
import type { Path } from '../types'
import { PathsetInput } from '../components'
import { LoginButton } from '../components/LoginButton'

const Home: NextPage = () => {
  const submit = (paths: Array<Path>) => {
    console.info({ paths })
  }

  return (
    <Container>
      <Head>
        <title>Forest</title>
        <meta
          name="description"
          content="Context forest filesystem"
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <chakra.header my={2}>
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
        <LoginButton
          position="fixed"
          right="0.25vw" top="0.25vw"
        />
      </chakra.header>

      <chakra.main>
        <PathsetInput
          onSubmit={submit}
        />
      </chakra.main>

      <chakra.footer
        position="fixed"
        bottom={4}
        width="100%"
        textAlign="center"
      >
        Developed July 2022 for
        <ChakraLink
          ml={3}
          borderBottom="1px dashed"
          _hover={{ borderBottom: '1px solid' }}
          href="https://fs.ethglobal.com"
        >HackFS</ChakraLink>.
      </chakra.footer>
    </Container>
  )
}

export default Home
