import {
  chakra, Container, Heading, Link as ChakraLink,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import NextLink from 'next/link'
import type { Path } from '../types'
import { PathsetInput } from '../components'

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

      <chakra.header>
        <Heading>Forest</Heading>
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
