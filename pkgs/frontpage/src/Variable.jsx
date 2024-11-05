import loadable from '@loadable/component'
import {
  Flex, Heading, Text, Wrap,
} from '@chakra-ui/react'

const List = loadable(() => import('./List'))
const Map = loadable(() => import('./Map'))

export default ({
  children = null, name, value,
  local = { bg: '#00FF0055' },
  ...props
}) => (
  <Flex
    direction="column" p={5}
    justify="center" align="center"
    {...local}
  >
    {name && <Heading>{name}</Heading>}
    {((() => {
      if(Array.isArray(value)) {
        return <List {...{ value }} {...props}/>
      } else if(value instanceof Object) {
        return <Map {...{ name, value }} {...props}/>
      } else {
        return <Text>{value}</Text>
      }
    })())}
    <Wrap>
      {children}
    </Wrap>
  </Flex>
)