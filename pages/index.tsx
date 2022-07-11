import { chakra, Container, Heading } from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
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

      <chakra.footer>
        Developed July 2022 for <Link href="https://fs.ethglobal.com">HackFS</Link>.
      </chakra.footer>
    </Container>
  )
}

export default Home
