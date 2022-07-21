import {
  chakra, Box,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { Path } from '../types'
import { PathsetInput } from '../components'

const Home: NextPage = () => {
  const submit = (paths: Array<Path>) => {
    console.info({ paths })
  }

  return (
    <Box>
      <Head>
        <title>𝔐𝔦̈𝔪𝔦𝔰</title>
      </Head>

      <chakra.main>
        <PathsetInput/>
      </chakra.main>
    </Box>
  )
}

export default Home