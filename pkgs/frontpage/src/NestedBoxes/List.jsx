import loadable from '@loadable/component'
import { ListItem, UnorderedList } from '@chakra-ui/react'

const Variable = loadable(() => import('./Variable'))

export default ({
  value, propsFor = () => ({ bg: 'transparent' })
}) => (
  <UnorderedList p={5} bg="orange">
    {(value.map((elem, index) => (
      <ListItem key={index} {...propsFor({ index })}>
        <Variable value={elem}/>
      </ListItem>
    )))}
  </UnorderedList>
)