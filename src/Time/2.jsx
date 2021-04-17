import {
  Stack, Text, OrderedList, ListItem,
} from '@chakra-ui/react'
import Variable from '../Variable'

export default () => (
  <Variable name={<Text>t<sub>1</sub></Text>}>
    <Variable name="Search Queue">
      <Variable name={
        <>
          <OrderedList
            textAlign="center"
            style={{ listStyle: 'none' }}
          >
            <ListItem>∅</ListItem>
            <ListItem>org</ListItem>
          </OrderedList>
          <Stack textAlign="center">
            <Text>ceramic://3</Text>
          </Stack>
        </>
      }>
        <Variable name="children"
          value={{
            '1Hive': 'ceramic://5…',
            MetaGame: 'ceramic://6…',
            'Raid Guild': 'ceramic://7…',
            SourceCred: 'ceramic://8…',
          }}
          colorFor={(key) => key === 'MetaGame' ? '#0000FF66' : '#00FF0033'}
        />
        <Variable name="overrides" value={[
          'did:3:1…',
          'did:3:2…',
          'did:3:3…',
        ]}/>
      </Variable>
    </Variable>
  </Variable>
)