import {
  OrderedList, ListItem, Text, Stack,
} from '@chakra-ui/react'
import Path from '../../Path'
import Variable from '../../Variable'

export default () => (
  <Variable
    name={
      <Stack textAlign="center">
        <Path elements={[
          '∅(did:3:2…))',
          'org',
          'MetaGame',
          'players',
          'dysbulic',
        ]}/>
        <Text>ceramic://3</Text>
      </Stack>
    }
  >
    <Variable name="children"
      value={{
        geo: 'ceramic://5…',
        philosophy: 'ceramic://5…',
        personal: 'ceramic://5…',
        porn: 'ceramic://6…',
        wares: 'ceramic://5…',
      }}
      propsFor={(key) => (
        { bg: key === 'MetaGame' ? 'yellow' : '#FF000033' }
      )}
    />
  </Variable>
)