import {
  Button, Image, Link, Stack, Tooltip,
} from "@chakra-ui/react"
import { SettingsButton } from "./SettingsButton"
import { ShortcutsButton } from "./ShortcutsButton"

export const PermaOptions = ({ ...props }) => {
  return (
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
            h="2rem" w="2rem" pt={0.5}
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
          h="2rem" w="2rem" pt={1}
          minW="auto"
          title="Keyboard Shortcuts"
        />
      </Tooltip>
      <Tooltip
        placement="left" hasArrow
        label="Settings"
      >
        <SettingsButton
          border="2px solid #00000088"
          borderRadius="50%"
          h="2rem" w="2rem" pt={1}
          minW="auto"
          title="Settings"
        />
      </Tooltip>
      <Tooltip
        placement="left" hasArrow
        label="GitHub"
      >
        <Link
          href="//github.com/dhappy/forests/"
          target="_blank"
          _hover={{ textDecoration: 'none' }}
        >
          <Button
            border="2px solid #00000088"
            borderRadius="50%"
            h="2rem" w="2rem" pt={0.5}
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
}