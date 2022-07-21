import {
  chakra, Button, Flex, Input, Stack, Text,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { PathsetInput } from '../components'
import { ChangeEvent, FormEvent, useState } from 'react'
import { Maybe } from '../types'

const Add: NextPage = () => {
  const [cid, setCID] = useState<Maybe<string>>(null)
  const [endpoint, setEndpoint] = (
    useState<Maybe<string>>(
      process.env.NEXT_PUBLIC_IPFS_URL ?? null
    )
  )

  const submit = async (evt: FormEvent) => {
    evt.preventDefault()

    const response = await fetch('/api/add', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({
        cid,
        endpoint,
      })
    })

    console.info({ evt })
  }

  return (
    <>
      <Head>
        <title>𝔐: Add Resource</title>
      </Head>

      <chakra.main>
        <Stack
          as="form"
          onSubmit={submit}
        >
          <Flex justify="center" align="center">
            <Text mr={0.5}>IPFS API:</Text>
            <Input
              placeholder="IPFS API Endpoint"
              value={endpoint ?? ''}
              onChange={
                (
                  { target: { value }}:
                  ChangeEvent<HTMLInputElement>
                ) => {
                  setEndpoint(value)
                }
              }
              required
              borderColor="#00000088"
              width={[
                '100%',
                'calc(100% - 20vw)',
                'calc(100% - 40vw)',
              ]}
            />
          </Flex>
          <Flex justify="center" align="center">
            <Text mr={0.5}>ipfs://</Text>
            <Input
              placeholder="IPFS CID"
              value={cid ?? ''}
              onChange={
                (
                  { target: { value }}:
                  ChangeEvent<HTMLInputElement>
                ) => {
                  setCID(value)
                }
              }
              required
              borderColor="#00000088"
              width={[
                '100%',
                'calc(100% - 20vw)',
                'calc(100% - 40vw)',
              ]}
            />
          </Flex>
          <PathsetInput
            mx={[0, '10vw', '20vw']}
          />
          <Flex justify="center">
            <Button
              colorScheme="green"
              type="submit"
            >
              Add Resource
            </Button>
          </Flex>
        </Stack>
      </chakra.main>
    </>
  )
}

export default Add