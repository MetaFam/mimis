import { Input } from '@chakra-ui/react';
import React, { ChangeEvent, FormEvent, useState } from 'react';

export const PathAtomInput: React.FC<{
  index: number
}> = (
  ({ index }) => {
    const [atom, setAtom] = useState<string>()

    return (
      <Input
        name={`atom[${index}][]`}
        value={atom}
        onInput={
          ({ target: tgt }: FormEvent<HTMLInputElement>) => {
            const target = tgt as HTMLInputElement
            target.style.width = `${target.scrollWidth}px`
          }
        }
        onChange={
          ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            setAtom(value)
          }
        }
      />
    )
  }
)