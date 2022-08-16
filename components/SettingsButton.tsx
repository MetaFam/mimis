import { Button, ButtonProps, FormControl, FormLabel, Input, InputGroup, InputRightAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import React, { useCallback, useState } from 'react'

export const SettingsButton = (
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ ...props }, ref) => {
      // const { isOpen, onOpen, onClose } = useDisclosure()
      const [isOpen, setOpened] = useState(false)
      const onOpen = useCallback(() => setOpened(true), [])
      const onClose = useCallback(() => setOpened(false), [])

      console.info({ isOpen })

      return (
        <>
          <Button
            onClick={() => { console.info({ op: isOpen }); onOpen() }}
            {...props}
            {...{ ref }}
          >
            ⚙
          </Button>
          <Modal {...{ isOpen, onClose }}>
            <ModalOverlay/>
            <ModalContent>
              <ModalHeader>Settings</ModalHeader>
              <ModalCloseButton/>
              <ModalBody>
                <FormControl>
                  <FormLabel>IPFS Gateway Rate Limit</FormLabel>
                  <InputGroup>
                    <Input placeholder="Limit" type="number"/>
                    <InputRightAddon>
                      <sup title="requests">req</sup> ⁄ <sub title="minute">min</sub>
                    </InputRightAddon>
                  </InputGroup>
                </FormControl>
              </ModalBody>

              <ModalFooter>
                <Button
                  colorScheme='red'
                  mr={3}
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme='green'
                  mr={3}
                  onClick={() => {
                    console.info('Saving…')
                    onClose()
                  }}
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )
    }
  )
)

SettingsButton.displayName = 'SettingsButton'