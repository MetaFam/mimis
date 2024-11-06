import {
  HashRouter as Router, Switch, Route,
  Link as RouterLink,
} from 'react-router-dom'
import {
  ChakraProvider, extendTheme, Menu, MenuItem,
  MenuButton, Button, MenuList, Link as ChakraLink,
} from '@chakra-ui/react'
import D3RadialTree from './D3RadialTree'
import Home from './Home'
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
              {isOpen ? '⟱' : '☰'}
            </MenuButton>
            <MenuList>
            <MenuItem>
                <Link to='/' title="🏗🏡🏘🏙🏛🏤🏩🏥🏭🏟🏞🕌">⛪ Home</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/mock' title="🥉💙💜❤💞⛺✈🎠💳🌃🚢🏝🗺">🦈 Mock</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/mock/radial' title="🏚🏠🏡🌃🚆🌇🎡🚛⛴🛰🏝🌌🗽">🎡 Radial Mock</Link>
              </MenuItem>
              <MenuItem>
                <Link to='/about' title="♑♒♓♈♉♊♋♌♍♎♏⛎♐">📰 About</Link>
              </MenuItem>
              <MenuItem>
                <ChakraLink href='//github.com/MetaFam/mimis' title="">👨‍💻 Source</ChakraLink>
              </MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
      <Switch>
        <Route path='/mock/radial'>
          <Mock Grapher={D3RadialTree}/>
        </Route>
        <Route path='/mock' component={Mock}/>
        <Route path='/' component={Home}/>
      </Switch>
    </Router>
  </ChakraProvider>
)