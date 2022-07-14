import { Box, Button, Image, Link, Stack, Tooltip } from "@chakra-ui/react"
import { ShortcutsButton } from "./ShortcutsButton"

export const PermaOptions = ({ ...props }) => (
  <Stack {...props}>
    <Tooltip
      placement="left" hasArrow
      label="Add Images"
    >
      <Link
        href="/add"
        _hover={{ textDecoration: 'none' }}
        title="Add Resources"
      >
        <Button
          border="2px solid #00000088"
          borderRadius="50%"
          h="2rem" w="2rem"
          minW="auto"
        >➕</Button>
      </Link>
    </Tooltip>
    <Tooltip
      placement="left" hasArrow
      label="Keyboard Shortcuts"
    >
      <ShortcutsButton
        border="2px solid #00000088"
        borderRadius="50%"
        h="2rem" w="2rem"
        minW="auto"
        title="Keyboard Shortcuts"
      />
    </Tooltip>
    <Tooltip
      placement="left" hasArrow
      label="GitHub"
    >
      <Link
        href="//github.com/dhappy/forests/"
        _hover={{ textDecoration: 'none' }}
      >
        <Button
          border="2px solid #00000088"
          borderRadius="50%"
          h="2rem" w="2rem"
          minW="auto"
          title="GitHub"
        >
          <Image
            alt="GitHub"
            src="github.svg"
            h="1rem" w="1rem" maxW="unset"
          />
        </Button>
      </Link>
    </Tooltip>
  </Stack>
)