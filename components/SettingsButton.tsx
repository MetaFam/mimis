import { ipfsLimitingDelay, ipfsLinkPattern } from '@/config';
import { SettingsContext } from '@/lib/SettingsContext';
import { chakra, Button, ButtonProps, FormControl, FormLabel, Input, InputGroup, InputLeftAddon, InputRightAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Spacer, Flex, Stack } from '@chakra-ui/react';
import React, { useContext, useState } from 'react'

export const SettingsButton = (
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ ...props }, ref) => {
      const { isOpen, onOpen, onClose } = useDisclosure()
      const {
        limitingDelay,
        gwPattern,
        setDelay: setLimitingDelay,
        setGwPattern,
      } = useContext(SettingsContext)
      const [delay, setDelay] = useState(limitingDelay)
      const [gw, setGw] = useState(gwPattern)

      return (
        <>
          <Button
            {...props}
            onClick={onOpen}
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
                <FormControl mb={3}>
                  <FormLabel>IPFS Gateway Pattern</FormLabel>
                  <InputGroup>
                    <InputLeftAddon>https://</InputLeftAddon>
                    <Input
                      placeholder="Pattern"
                      value={gw}
                      onChange={({ target: { value } }) => {
                        setGw(value)
                      }}
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel>IPFS Gateway Rate Limit</FormLabel>
                  <InputGroup>
                    <Input 
                      placeholder="Limit"
                      type="number"
                      value={delay}
                      onChange={({ target: { value } }) => {
                        setDelay(Number(value))
                      }}
                    />
                    <InputRightAddon>
                      <sup><span title="milliseconds">ms</span> wait </sup> ⁄ <sub>job</sub>
                    </InputRightAddon>
                  </InputGroup>
                </FormControl>

              </ModalBody>

              <ModalFooter>
                <Stack w="full">
                  <Flex mb={5}>
                    <Button 
                      colorScheme="blue"
                      mr={3}
                      onClick={() => {
                        setGw('{v1cid}.ipfs.localhost:8080/{path}')
                        setDelay(0)
                      }}
                    >
                      Use <chakra.code ml={2}>localhost</chakra.code>
                    </Button>
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        setGw(ipfsLinkPattern.replace(/^https?:\/\//, ''))
                        setDelay(ipfsLimitingDelay)
                      }}
                    >
                      Use Defaults
                    </Button>
                  </Flex>

                  <Flex alignSelf="end">
                    <Button
                      colorScheme="red"
                      mr={3}
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme="green"
                      mr={3}
                      onClick={() => {
                        setGwPattern(gw)
                        setLimitingDelay(delay)
                        onClose()
                      }}
                    >
                      Save
                    </Button>
                  </Flex>
                </Stack>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )
    }
  )
)

SettingsButton.displayName = 'SettingsButton'