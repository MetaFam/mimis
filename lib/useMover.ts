import {
  Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef,
} from 'react'
import { SettingsContext } from '@/lib/SettingsContext'

export const useMover = (
  (
    { setFrom, setTo }:
    {
      setFrom: Dispatch<SetStateAction<Array<unknown>>>
      setTo: Dispatch<SetStateAction<Array<unknown>>>
    }
  ) => {
    const { limitingDelay } = useContext(SettingsContext)

    const move = useCallback(() => {
      setFrom((from: Array<unknown>) => {
        if(from.length === 0) {
          return from // w/o this `from` changes on every render & blows the stack
        }

        if(limitingDelay === 0) {
          setTo((to: Array<unknown>) => [...to, ...from])
          return []
        }

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

        return from.slice(1)
      })
    }, [limitingDelay, setFrom, setTo])

    const interval = useRef<NodeJS.Timer>()
    return useCallback(() => {
      const clear = () => clearInterval(interval.current)

      clear()

      if(limitingDelay > 0) {
        interval.current = setInterval(move, limitingDelay)
      } else {
        move()
      }
      return clear
    }, [limitingDelay, move])
  }
)

export default useMover