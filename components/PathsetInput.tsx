import {
  Box, Button, Input, ListItem, ListProps, UnorderedList,
  Wrap, WrapItem,
} from '@chakra-ui/react'
import React, {
  ChangeEvent, Dispatch, KeyboardEvent, SetStateAction, useEffect, useState,
} from 'react'
import type {
  AddPathAtomProps, AddPathProps,
  PathsetAtomPosition,
  RemovePathAtomProps, RemovePathProps, Pathset,
} from '../types'

export const PathsetInput: React.FC<{
  onSubmit?: (paths: Pathset) => void
  paths?: Pathset
  setPaths?: Dispatch<SetStateAction<Pathset>>
} & ListProps> = (
  ({
    onSubmit,
    paths: externalPaths,
    setPaths: setExternalPaths,
    ...props
  }) => {
    const [internalPaths, setInternalPaths] = useState<Pathset>([['']])
    const paths = externalPaths ?? internalPaths
    const setPaths = setExternalPaths ?? setInternalPaths
    const [focused, setFocused] = useState({ pidx: 0, aidx: 0 })

    useEffect(() => {
      if(paths.length === 0) {
        setPaths([['']])
      }
    }, [paths, setPaths])

    const removeAtom = ({ aidx, pidx }: PathsetAtomPosition) => {
      setPaths((paths: Pathset) => {
        const path = paths[pidx]
        if(path.length <= 1) {
          return removePath({ paths, pidx })
        } else {
          return removePathAtom({ paths, pidx, aidx })
        }
      })
    }

    const addPathAtom = (
      ({ paths, atom = '', pidx, aidx }: AddPathAtomProps) => ([
        ...paths.slice(0, pidx),
        [
          ...paths[pidx].slice(0, aidx + 1),
          atom,
          ...paths[pidx].slice(aidx + 1),
        ],
        ...paths.slice(pidx + 1),
      ])
    )

    const removePathAtom = (
      ({ paths, pidx, aidx }: RemovePathAtomProps) => ([
        ...paths.slice(0, pidx),
        [
          ...paths[pidx].slice(0, aidx),
          ...paths[pidx].slice(aidx + 1),
        ],
        ...paths.slice(pidx + 1),
      ]) as Pathset
    )

    const addPath = ({ paths, path = [''], pidx }: AddPathProps) => ([
      ...paths.slice(0, pidx + 1),
      path,
      ...paths.slice(pidx + 1),
    ])

    const removePath = ({ paths, pidx }: RemovePathProps) => ([
      ...paths.slice(0, pidx),
      ...paths.slice(pidx + 1),
    ]) as Pathset

    const submit = () => {
      onSubmit?.(paths)
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
        setPaths((paths) => addPath({ paths, pidx }))
        setFocused({ pidx: pidx + 1, aidx: 0 })
      } else if(evt.key === 'Backspace' && evt.ctrlKey) {
        evt.preventDefault()
        setPaths((paths) => {
          const path = paths[pidx]
          if(path.length <= 1) {
            if(paths.length > 1) {
              setFocused({
                pidx: pidx - 1,
                aidx: (paths[pidx - 1]?.length ?? 0) - 1,
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
      } else if(
        evt.key === 'Tab'
        || (evt.key === ' ' && !evt.ctrlKey)
      ) {
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
      } else if(evt.key === ' ' && evt.ctrlKey) {
        const element = evt.target as HTMLInputElement
        setText({
          element,
          text: `${element.value} `,
          pidx,
          aidx,
        })
      }
    }

    const setText = (
      { element, text, pidx, aidx}:
      {
        element: HTMLElement
        text: string
        pidx: number
        aidx: number
      }
    ) => {
      element.style.width = '0'
      element.style.width = `min(30vw, ${element.scrollWidth + 4}px)`

      setPaths((paths) => ([
        ...paths.slice(0, pidx),
        [
          ...paths[pidx].slice(0, aidx),
          text,
          ...paths[pidx].slice(aidx + 1),
        ],
        ...paths.slice(pidx + 1),
      ]))
      setFocused({ pidx, aidx })
    }

    const changed = (
      target: HTMLInputElement,
      pidx: number,
      aidx: number,
    ) => {
      setText({
        element: target,
        text: target.value,
        pidx,
        aidx,
      })
    }

    return (
      <UnorderedList {...props}>
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
                const multiple = (
                  paths.length > 1 || paths[0].length > 1
                )
                return (
                  <WrapItem
                    key={index}
                    m="auto" p={0}
                    sx={{
                      'button': { opacity: 0.3 },
                      '&:hover button': { opacity: 1 },
                    }}
                  >
                    <Input
                      value={atom}
                      textAlign="center"
                      w="7em" m={0} p="0 0.25rem"
                      height="auto"
                      bg="#FFFF0066"
                      borderColor="#00000066"
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
                    {multiple && (
                      <Button
                        position="relative"
                        p="0.2rem 0.1rem"
                        h="auto" w="auto" minW="auto"
                        lineHeight={0.5}
                        left={-2}
                        _hover={{ opacity: 1}}
                        onClick={() => {
                          removeAtom({ aidx, pidx })
                        }}
                        bg="red" color="white"
                      >−</Button>
                    )}
                    {aidx < path.length - 1 && (
                      <Box ml={-1}>/</Box>
                    )}
                  </WrapItem>
                )
              })}
            </Wrap>
          </ListItem>
        ))}
      </UnorderedList>
    )
  }
)