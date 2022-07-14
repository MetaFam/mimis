import { Box, Button, Link, Stack } from "@chakra-ui/react"
import { ShortcutsButton } from "./ShortcutsButton"

export const PermaOptions = ({ ...props }) => (
  <Stack {...props}>
    <Link
      href="/add"
      _hover={{ textDecoration: 'none' }}
    >
      <Button
        border="2px solid #00000088"
        borderRadius="50%"
        h="2rem" w="2rem"
        minW="auto"
      >➕</Button>
    </Link>
    <ShortcutsButton
      border="2px solid #00000088"
      borderRadius="50%"
      h="2rem" w="2rem"
      minW="auto"
    />
  </Stack>
)