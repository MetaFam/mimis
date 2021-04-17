import loadable from '@loadable/component'
import { ListItem, UnorderedList } from '@chakra-ui/react'

const Variable = loadable(() => import('./Variable'))

export default ({ value, colorFor = () => 'transparent' }) => (
  <UnorderedList p={12} bg="orange">
    {(value.map((elem, index) => (
      <ListItem key={index} bg={colorFor({ index })}>
        <Variable value={elem}/>
      </ListItem>
    )))}
  </UnorderedList>
)