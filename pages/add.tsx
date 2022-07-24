import {
  chakra, Button, Flex, Input, Stack, Text, useToast,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { PathsetInput } from '../components'
import { ChangeEvent, FormEvent, useState } from 'react'
import type { Maybe, Pathset } from '../types'
import JSON5 from 'json5'

const Add: NextPage = () => {
  const [cid, setCID] = useState<Maybe<string>>(null)
  const [endpoint, setEndpoint] = (
    useState<Maybe<string>>(
      process.env.NEXT_PUBLIC_IPFS_API_URL ?? null
    )
  )
  const [paths, setPaths] = useState<Pathset>([])
  const toast = useToast()

  const submit = async (evt: FormEvent) => {
    evt.preventDefault()

    const response = await fetch('/api/add', {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON5.stringify({
        cid,
        endpoint,
        paths,
      })
    })
    const text = await response.text()
    const { count, message } = JSON5.parse(text)

    if(count != null) {
      toast({
        variant: 'top-accent',
        title: `${count} Actions`,
        description: (
          `The input of ${cid} resulted in the creation`
          + ` of ${count} artifact${count === 1 ? '' : 's'}.`
        ),
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    }
    if(message != null) {
      toast({
        variant: 'left-accent',
        title: 'Error: Message',
        description: `Error: “${message}”`,
        status: 'error',
        duration: 15000,
        isClosable: true,
      })
    }
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
          <Flex mx={[0, 10, 32]}>
            <PathsetInput
              {...{ paths, setPaths } }
              mx={[0, '10vw', '20vw']}
            />
          </Flex>
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