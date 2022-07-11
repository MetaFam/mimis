import {
  Box, Button, Input, ListItem, UnorderedList,
  Wrap, WrapItem,
} from '@chakra-ui/react'
import React, {
  ChangeEvent, KeyboardEvent, useState,
} from 'react'
import type {
  Path, AddPathAtomProps, AddPathProps,
  PathsetPosition, PathsetAtomPosition,
} from '../types'

export const PathsetInput: React.FC<{
  onSubmit: (paths: Array<Path>) => void
}> = (
  ({ onSubmit }) => {
    const [paths, setPaths] = useState<Array<Path>>([['']])
    const [focused, setFocused] = useState({ pidx: 0, aidx: 0 })

    const addPathAtom = ({ paths, atom = '', pidx, aidx }: AddPathAtomProps) => ([
      ...paths.slice(0, pidx),
      [
        ...paths[pidx].slice(0, aidx + 1),
        atom,
        ...paths[pidx].slice(aidx + 1),
      ],
      ...paths.slice(pidx + 1),
    ])

    const removePathAtom = ({ paths, pidx, aidx }: PathsetAtomPosition) => ([
      ...paths.slice(0, pidx),
      [
        ...paths[pidx].slice(0, aidx),
        ...paths[pidx].slice(aidx + 1),
      ],
      ...paths.slice(pidx + 1),
    ])

    const addPath = ({ paths, path = [''], pidx }: AddPathProps) => ([
      ...paths.slice(0, pidx + 1),
      path,
      ...paths.slice(pidx + 1),
    ])

    const removePath = ({ paths, pidx }: PathsetPosition) => ([
      ...paths.slice(0, pidx),
      ...paths.slice(pidx + 1),
    ])

    const submit = () => {
      onSubmit(paths)
    }

    const keydown = (
      evt: KeyboardEvent,
      pidx: number,
      aidx: number,
    ) => {
      if(evt.key === '/' && evt.ctrlKey) {
        evt.preventDefault()
        setPaths((paths) => addPathAtom({ paths, pidx, aidx }))
        setFocused({ pidx, aidx: aidx + 1 })
      } else if(evt.key === 'Enter') {
        evt.preventDefault()
        setPaths((paths) => addPath({ paths, pidx, aidx }))
        setFocused({ pidx: pidx + 1, aidx: 0 })
      } else if(evt.key === 'Backspace' && evt.ctrlKey) {
        evt.preventDefault()
        setPaths((paths) => {
          const path = paths[pidx]
          if(path.length <= 1) {
            if(paths.length > 1) {
              setFocused({
                pidx: pidx - 1,
                aidx: paths[pidx - 1].length - 1,
              })
              return removePath({ paths, pidx })
            } else {
              return [['']]
            }
          } else {
            setFocused({ pidx, aidx: Math.max(0, aidx - 1) })
            return removePathAtom({ paths, pidx, aidx })
          }
        })
      } else if(evt.key === 'Tab' && evt.shiftKey) {
        evt.preventDefault()
        if(aidx <= 0) {
          setPaths((paths) => addPathAtom({ paths, pidx, aidx: -1 }))
        }
        setFocused({ pidx, aidx: aidx - 1 })
      } else if(evt.key === 'Tab') {
        evt.preventDefault()
        if(aidx >= paths[pidx].length - 1) {
          setPaths((paths) => addPathAtom({ paths, pidx, aidx }))
        }
        setFocused({ pidx, aidx: aidx + 1 })
      } else if(evt.key === 'ArrowLeft' && evt.ctrlKey && evt.shiftKey) {
        if(aidx <= 0) {
          if(pidx > 0) {
            setFocused({ pidx: pidx - 1, aidx: paths[pidx - 1].length - 1 })
          }
        } else if(aidx >= paths[pidx].length) {
          if(pidx < paths.length) {
            setFocused({ pidx: pidx + 1, aidx: 0 })
          }
        } else {
          setFocused({ pidx, aidx: aidx - 1 })
        }
      } else if(evt.key === 'ArrowRight' && evt.ctrlKey && evt.shiftKey) {
        if(aidx >= paths[pidx].length - 1) {
          if(pidx < paths.length) {
            setFocused({ pidx: pidx + 1, aidx: 0 })
          }
        } else {
          setFocused({ pidx, aidx: aidx + 1 })
        }
      } else if(evt.key === 'ArrowDown' && evt.ctrlKey && evt.shiftKey) {
        if(pidx < paths.length - 1) {
          setFocused({
            pidx: pidx + 1,
            aidx: Math.min(aidx, paths[pidx + 1].length - 1) })
        }
      } else if(evt.key === 'ArrowUp' && evt.ctrlKey && evt.shiftKey) {
        if(pidx > 0) {
          setFocused({
            pidx: pidx - 1,
            aidx: Math.min(aidx, paths[pidx - 1].length - 1) })
        }
      }
    }

    const changed = (
      target: HTMLInputElement,
      pidx: number,
      aidx: number,
    ) => {
      target.style.width = '0'
      target.style.width = `min(30vw, ${target.scrollWidth + 4}px)`

      setPaths((paths) => ([
        ...paths.slice(0, pidx),
        [
          ...paths[pidx].slice(0, aidx),
          target.value,
          ...paths[pidx].slice(aidx + 1),
        ],
        ...paths.slice(pidx + 1),
      ]))
    }

    return (
      <Box
        as="form"
        onSubmit={submit}
      >
        <UnorderedList>
          {paths.map((path, pidx) => (
            <ListItem key={pidx}>
              <Wrap>
                {path.map((atom, aidx) => {
                  const index = (
                    paths
                    .slice(0, pidx)
                    .map((pth) => pth.length)
                    .reduce((acc, val) => acc = val, 0)
                    + 1
                    + aidx + 1
                  )
                  const focus = (
                    focused.pidx === pidx
                    && focused.aidx === aidx
                  )
                  return (
                    <WrapItem
                      key={index}
                      m={0}
                    >
                      <Input
                        value={atom}
                        textAlign="center"
                        w="7em" m={0}
                        autoFocus={focus}
                        id={`atom-${index}`}
                        _focus={{ bg: '#0000FF33' }}
                        ref={(ref: HTMLInputElement) => {
                          if(ref) {
                            if(focus) {
                              setTimeout(() => ref.focus(), 0)
                            }
                            ref.style.width = '0'
                            ref.style.width = (
                              `max(2em, min(30vw, ${ref.scrollWidth + 4}px))`
                            )
                          }
                        }}
                        onKeyDown={(evt: KeyboardEvent<HTMLInputElement>) => {
                          keydown(evt, pidx, aidx)
                        }}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                          changed(target, pidx, aidx)
                        }}
                      />
                      <Button
                        position="relative"
                        px={2}
                        lineHeight={0.5}
                        left={-10}
                        opacity={0.25}
                        _hover={{ opacity: 1}}
                        onClick={() => {
                          setPaths((paths) => removePathAtom({ paths, pidx, aidx }))
                        }}
                      >−</Button>
                      {aidx < path.length - 1 && (
                        <Box ml={10}>/</Box>
                      )}
                    </WrapItem>
                  )
                })}
              </Wrap>
            </ListItem>
          ))}
        </UnorderedList>
      </Box>
    )
  }
)