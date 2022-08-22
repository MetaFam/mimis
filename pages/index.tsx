import {
  chakra, Box, Spinner, Image, Wrap, WrapItem, Flex,
  Alert, AlertIcon, AlertTitle, AlertDescription, Tooltip,
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
  const [cids, setCIDs] = useState<Array<string>>([])
  const [loading, setLoading] = useState(false)
  const { limitingDelay, gwPattern } = useContext(SettingsContext)
  const [error, setError] = useState<Maybe<string>>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const move = useMover({
    setFrom: setPending as Dispatch<SetStateAction<unknown[]>>,
    setTo: setCIDs as Dispatch<SetStateAction<unknown[]>>,
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
        setErrors({})

        if(!results.ok) {
          throw new Error(message)
        }

        setPending(cids)

        move()

        setLoading(false)
      } catch(err) {
        if(!(err instanceof DOMException)) {
          const message = (err as Error).message
          console.error({ message })
          setError(message)
          setLoading(false)
        }
      }
    }

    search()
  }, [paths])

  return (
    <Box>
      {error && (
        <Alert status="error">
          <AlertIcon/>
          <AlertTitle>Loading Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Head>
        <title>𝔐𝔦̈𝔪𝔦𝔰</title>
      </Head>

      <PathsetInput {...{ paths, setPaths }} mb={5}/>
      {loading && <Flex justify="center"><Spinner thickness="5px"/></Flex>}
      {pending.length > 0 && (
        <Flex justify="center">
          <chakra.b mr={2} fontSize="150%" mt={-2}>{pending.length}</chakra.b> Remaining
          <chakra.em ml={2}>
            (The IPFS gateway is rate limited to{' '}
            {(60 * 1000 * 100) % limitingDelay === 0 ? '' : '~'}
            {((60 * 1000) / limitingDelay).toFixed(2).replace(/\.?0+$/g, '')} requests per minute.)
          </chakra.em>
        </Flex>
      )}
      <Wrap mr={32} mb={10}>
        {cids?.map((cid) => {
          const ipfsURL = `ipfs://${cid}`

          return (
            <WrapItem key={cid}>
              {errors[cid] ? (
                <Tooltip label={`${errors[cid]} (${ipfsURL} ⧉)`}>
                  <Box
                    bg="red" w="2rem" h="2rem"
                    border="2px dashed black"
                    onClick={() => navigator.clipboard.writeText(ipfsURL)}
                  />
                </Tooltip>
              ) : (
                <Image
                  w="2rem" maxH="2rem"
                  transition="all 1s"
                  _hover={{
                    w: '5rem',
                    maxH: '5rem',
                  }}
                  alt={ipfsURL}
                  src={httpURL(ipfsURL, { gwPattern }) ?? undefined}
                  onError={(evt) => {
                    setErrors((errs) => ({ ...errs, [cid]: 'Probably Gateway Timeout, Maybe Rate Limiting' }))
                  }}
                  onClick={() => navigator.clipboard.writeText(ipfsURL)}
                />
              )}
            </WrapItem>
          )
        })}
      </Wrap>
    </Box>
  )
}

export default Home