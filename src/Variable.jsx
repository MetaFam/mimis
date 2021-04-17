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
      console.info('VAR', name, props)
      if(Array.isArray(value)) {
        return <List {...{ value }} {...props}/>
      } else if(typeof value === 'string') {
        return <Text>{value}</Text>
      } else if(value instanceof Object) {
        return <Map {...{ name, value }} {...props}/>
      } else {
        return (
          <pre>
            {JSON.stringify(value)}
          </pre>
        )
      }
    })())}
    <Wrap>
      {children}
    </Wrap>
  </Flex>
)