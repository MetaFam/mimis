import {
  chakra, Box, Spinner, Image, Wrap, WrapItem, Flex, Text, Alert,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { Maybe, Pathset } from '@/types'
import { PathsetInput } from '@/components'
import {
  Dispatch, SetStateAction, useEffect, useRef, useState, useContext,
} from 'react';
import JSON5 from 'json5'
import { httpURL } from '@/lib/helpers'
import { useMover } from '@/lib/useMover'
import { SettingsContext } from '@/lib/SettingsContext'

export const Home: NextPage = () => {
  const [paths, setPaths] = useState<Pathset>([['**']])
  const abortController = useRef<Maybe<AbortController>>(null)
  const [pending, setPending] = useState<Array<string>>([])
  console.log({pending})
  const [cids, setCIDs] = useState<Array<string>>([])
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const { limitingDelay } = useContext(SettingsContext)
  useMover({
    from: pending, 
    setFrom: setPending as Dispatch<SetStateAction<unknown[]>>,
    setTo: setCIDs as Dispatch<SetStateAction<unknown[]>>,
    setRemaining,
  })

  useEffect(() => {
    const search = async () => {
      try {
        setLoading(true)

        abortController.current?.abort()
        abortController.current = new AbortController()
        const results = await fetch(
          `/api/search?${new URLSearchParams({
            paths: JSON5.stringify(paths)
          })}`,
          { signal: abortController.current.signal },
        )
        abortController.current = null

        const body = await results.text()
        const { cids, message } = JSON5.parse(body)

        setCIDs([])

        if(!results.ok) {
          throw new Error(message)
        }

        setPending(cids)
      } catch(err) {
        if(!(err instanceof DOMException)) {
          console.error((err as Error).message)
        }
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [paths])

  return (
    <Box>
      <Alert status="error">
        <Text>
          Switching from Neo4j Sandbox <em>(deleted every seven days)</em> to Neo4j Aura <em>(cloud-based)</em> introduced a dependency error. It either doesn’t load the final result, or recurses forever.
        </Text>
        <Text>
          I’m aware of the issue and addressing it as quickly as possible.
        </Text>
      </Alert>

      <Head>
        <title>𝔐𝔦̈𝔪𝔦𝔰</title>
      </Head>

      <PathsetInput {...{ paths, setPaths }} mb={5}/>
      {loading && <Spinner thickness='5'/>}
      {remaining > 0 && (
        <Flex>
          {remaining} Remaining
          <chakra.em ml={3}>
            (The IPFS gateway is rate limited{' '}
            {(60 * 1000) / limitingDelay} requests per minute.)
          </chakra.em>
        </Flex>
      )}
      <Wrap mr={32} mb={10}>
        {cids?.map((cid) => (
          <WrapItem key={cid}>
            <Image
              w="2rem" maxH="2rem"
              transition="all 1s"
              _hover={{
                w: '5rem',
                maxH: '5rem',
              }}
              alt=""
              src={httpURL(`ipfs://${cid}`) ?? undefined}
            />
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  )
}

export default Home