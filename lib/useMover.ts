import {
  Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef,
} from 'react'
import { SettingsContext } from '@/lib/SettingsContext'

export const useMover = (
  (
    { from, setFrom, setTo, setRemaining }:
    {
      from: Array<unknown>
      setFrom: Dispatch<SetStateAction<Array<unknown>>>
      setTo: Dispatch<SetStateAction<Array<unknown>>>
      setRemaining: Dispatch<SetStateAction<number>>
    }
  ) => {
    const { limitingDelay } = useContext(SettingsContext)

    const move = useCallback(() => {
      setFrom((from: Array<unknown>) => {
        console.log({p: from, limitingDelay})
        if(limitingDelay === 0) {
          setTo(from)
        } else {
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
        }
        return []
      })
    }, [setFrom, setRemaining, setTo])

    useEffect(() => {
      let interval: NodeJS.Timer | undefined
      if(limitingDelay > 0) {
        interval = setInterval(move, limitingDelay)
      } else {
        move()
      }
      return () => {
        clearInterval(interval)
      }
    }, [limitingDelay, from, move])
  }
)

export default useMover