import loadable from '@loadable/component'
import {
  Table, TableCaption, Tbody, Tr, Td,
} from '@chakra-ui/react'

const Variable = loadable(() => import('../Variable'))

export default ({
  name, value, color,
  propsFor = () => ({ bg: '#FF000033' }),
  ...props
}) => (
  <Table bg={color} p={5}>
    <Tbody>
      {(Object.entries(value).map(([name, val], idx) => (
        <Tr key={idx} {...propsFor(name)}>
          <Td p={3}>{name}</Td>
          <Td><Variable value={val} {...props}/></Td>
        </Tr>
      )))}
    </Tbody>
  </Table>
)