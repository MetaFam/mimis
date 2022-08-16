import {
  Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef,
} from 'react'
import { SettingsContext } from '@/lib/SettingsContext'

export const useMover = (
  (
    { setFrom, setTo, setRemaining }:
    {
      setFrom: Dispatch<SetStateAction<Array<unknown>>>
      setTo: Dispatch<SetStateAction<Array<unknown>>>
      setRemaining: Dispatch<SetStateAction<number>>
    }
  ) => {
    const { limitedRate } = useContext(SettingsContext)
    const interval = useRef<NodeJS.Timer>()

    const move = useCallback(() => {
      setFrom((from: Array<unknown>) => {
        if(from.length >= 1) {
          const [next] = from
          setTo((to: Array<unknown>) => {
            const [last] = to.slice(-1)
            // This component is called twice in quick
            // succession & without this the first CID
            // is duplicated. (It is strict mode using
            // the Next.js dev server in React 18.)
            if(last !== next) {
              return [...to, next]
            }
            return to
          })
          setRemaining(from.length - 1)

          return from.slice(1)
        }
        return from
      })
    }, [setFrom, setRemaining, setTo])

    useEffect(() => {
      clearInterval(interval.current)
      if(limitedRate > 0) {
        interval.current = setInterval(move, limitedRate)
      } else {
        setFrom((from) => {
          setTo(from)
          setRemaining(0)
          return []
        })
      }
    }, [limitedRate, move, setFrom, setTo, setRemaining])
  }
)

