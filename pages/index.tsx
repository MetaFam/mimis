import {
  chakra, Box, Spinner, Image, Wrap, WrapItem,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { Maybe, Pathset } from '@/types'
import { PathsetInput } from '@/components'
import { useEffect, useRef, useState } from 'react'
import JSON5 from 'json5'

const Home: NextPage = () => {
  const [paths, setPaths] = useState<Pathset>([['**']])
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

        const body = await results.text()
        const { cids, message } = JSON5.parse(body)
        if(!results.ok) {
          throw new Error(message)
        } else {
          setCIDs(cids)
        }
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
      <Head>
        <title>𝔐𝔦̈𝔪𝔦𝔰</title>
      </Head>

      <chakra.main>
        <PathsetInput {...{ paths, setPaths }} mb={5}/>
        {loading && <Spinner thickness='5'/>}
        <Wrap mr={32} mb={10}>
          {cids?.map((cid) => (
            <WrapItem key={cid}>
              <Image
                w="2rem" maxH="2rem"
                sx={{
                  '@keyframes grow': {
                    from: {
                      w: '2rem',
                      maxH: '2rem',
                    },
                    to: {
                      w: '5rem',
                      maxH: '5rem',
                    }
                  },
                  '@keyframes shrink': {
                    from: {
                      w: '5rem',
                      maxH: '5rem',
                    },
                    to: {
                      w: '2rem',
                      maxH: '2rem',
                    }
                  },
                  animationName: 'shrink',
                  animationDuration: '1s',
                }}
                _hover={{
                  animationName: 'grow',
                  animationDuration: '1.5s',
                  animationFillMode: 'forwards',
                }}
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