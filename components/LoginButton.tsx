import React from 'react'
import { Box, Button, Image, Tooltip } from '@chakra-ui/react'
import { useSIWE } from '../hooks';

export const LoginButton = ({ ...props}) => {
  const { connected, connect, disconnect, name, address } = (
    useSIWE()
  )

  return (
    connected ? (
      <Tooltip label="Disconnect">
        <Button
          title="Disconnect"
          onClick={disconnect}
          border="2px solid #00000088"
          height="auto"
          {...props}
        >
          <Image
            src="connected.svg"
            alt="Disconnect"
            h="10vh" w="10vh"
          />
          {(name || address) && (
            <Box textAlign="center">
              {name ?? (
                `${address?.slice(0, 5)}…${address?.slice(-5)}`
              )}
            </Box>
          )}
        </Button>
      </Tooltip>
    ) : (
      <Tooltip label="Sign-In With Ethereum">
        <Button
          title="Sign-In With Ethereum"
          onClick={connect}
          border="2px solid #00000088"
          {...props}
        >
          <Image
            src="siwe.svg"
            alt="Sign-In With Ethereum"
            h="10vh" w="10vh"
          />
        </Button>
      </Tooltip>
    )
  )
}