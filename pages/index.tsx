import {
  Box,
  chakra, Container, Flex, Heading, Image, Link as ChakraLink,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import NextLink from 'next/link'
import type { Path } from '../types'
import { PathsetInput } from '../components'
import { LoginButton } from '../components/LoginButton'
import { PermaOptions } from '../components/PermaOptions'

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