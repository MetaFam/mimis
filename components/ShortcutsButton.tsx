import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react'

export const ShortcutsButton = (
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ ...props }, ref) => (
      <Button {...props} {...{ ref }}>⌨</Button>
    )
  )
)

ShortcutsButton.displayName = 'ShortcutsButton'