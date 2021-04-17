import {
  Stack, Text, OrderedList, ListItem,
} from '@chakra-ui/react'
import Variable from '../../Variable'
import T0 from './0'
import T1 from './1'
import T2 from './2'
import T3 from './3'

export default () => (
  <Variable name={<Text>t<sub>1</sub></Text>}>
    <Variable name="Search Queue">
      <T0/>
      <T1/>
      <T2/>
      <T3/>
    </Variable>
  </Variable>
)