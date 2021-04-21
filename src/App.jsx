import {
  HashRouter as Router, Switch, Route,
  Link as RouterLink,
} from 'react-router-dom'
import {
  ChakraProvider, extendTheme, Menu, MenuItem,
  MenuButton, Button, MenuList, Link as ChakraLink,
  chakra,
} from '@chakra-ui/react'
import {
  ChevronDownIcon, HamburgerIcon
} from '@chakra-ui/icons'
import D3RadialTree from './D3RadialTree'
import Mock from './Mock'

const overrides = {
  config: {
    initialColorMode: 'dark',
  },
  styles: {
    global: {
      body: {
        minH: '100vh',
      },
      a: {
        textDecoration: 'underline',
      },
    },
  },
}
const theme = extendTheme(overrides)

const Link = ({ children, to }) => (
  <ChakraLink
    as={RouterLink}
    {...{ to }}
    w='100%'
  >{children}</ChakraLink>
)

export default () => (
  <ChakraProvider theme={theme}>
    <Router basename='/'>
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton
              isActive={isOpen} as={Button}
              position='fixed' top='1rem' left='1rem'
            >
              {isOpen ? <ChevronDownIcon/> : <HamburgerIcon/>}
            </MenuButton>
            <MenuList>
            <MenuItem>
                <Link to='/'>🏡 Store as CBOR-DAG</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/ceramic'>🎡 Store as Ceramic</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/build'>✍ Build from DAG</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/about'>📰 About</Link>
              </MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
      <Switch>
        <Route path='/mock/radial'>
          <Mock Grapher={D3RadialTree}/>
        </Route>
        <Route path='/' component={Mock}/>
      </Switch>
    </Router>
  </ChakraProvider>
)