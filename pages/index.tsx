import {
  chakra, Box, Spinner, Image, Wrap, WrapItem,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { Maybe, Path, Pathset } from '../types'
import { PathsetInput } from '../components'
import { useEffect, useRef, useState } from 'react'
import JSON5 from 'json5'

const Home: NextPage = () => {
  const [paths, setPaths] = useState<Pathset>([])
  const abortController = useRef<Maybe<AbortController>>(null)
  const [cids, setCIDs] = useState<Array<string>>([])
  const [loading, setLoading] = useState(false)
  const GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL

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
        console.info({ results })
        setLoading(false)
        setCIDs(JSON5.parse(await results.text()))
      } catch(err) {
        if(!(err instanceof DOMException)) {
          console.error((err as Error).message)
        }
      }
    }

    search()
  }, [paths])

  return (
    <Box>
      <Head>
        <title>𝔐𝔦̈𝔪𝔦𝔰</title>
      </Head>

      <chakra.main>
        <PathsetInput {...{ paths, setPaths }} mb={5}/>
        {loading && <Spinner thickness='5'/>}
        <Wrap mr={32} mb={10}>
          {cids.map((cid) => (
            <WrapItem key={cid}>
              <Image
                w="2rem" maxH="2rem"
                alt=""
                src={`${GATEWAY}${cid}`}
              />
            </WrapItem>
          ))}
        </Wrap>
      </chakra.main>
    </Box>
  )
}

export default Home