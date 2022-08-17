import { chakra, Button, ButtonProps, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Flex, useDisclosure, Table, Tr, Th, Td, Thead, Tbody } from '@chakra-ui/react'
import React from 'react'

export const ShortcutsButton = (
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ ...props }, ref) => {
      const { isOpen, onOpen, onClose } = useDisclosure()

      return (
        <>
          <Button
            {...props}
            onClick={onOpen}
            {...{ ref }}
          >
            ⌨
          </Button>
          <Modal {...{ isOpen, onClose }}>
            <ModalOverlay/>
            <ModalContent>
              <ModalHeader>Keyboard Shortcuts</ModalHeader>
              <ModalCloseButton/>
              <ModalBody>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Key Combination</Th>
                      <Th>Effect</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td><chakra.code>CTRL + ←</chakra.code></Td>
                      <Td>Navigate one path cell to the left.</Td>
                    </Tr>
                    <Tr>
                      <Td><chakra.code>CTRL + →</chakra.code></Td>
                      <Td>Navigate one path cell to the right.</Td>
                    </Tr>
                    <Tr>
                      <Td><chakra.code>CTRL + ↑</chakra.code></Td>
                      <Td>Navigate one path cell up.</Td>
                    </Tr>
                    <Tr>
                      <Td><chakra.code>CTRL + ↓</chakra.code></Td>
                      <Td>Navigate one path cell down.</Td>
                    </Tr>
                    <Tr>
                      <Td><chakra.code>CTRL + Backspace</chakra.code></Td>
                      <Td>Remove the current cell.</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </ModalBody>

              <ModalFooter>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={onClose}
                >
                  <b>𝗢𝗞</b>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )
    }
  )
)

ShortcutsButton.displayName = 'ShortcutsButton'

export default ShortcutsButton