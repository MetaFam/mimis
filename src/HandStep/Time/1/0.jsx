import {
  OrderedList, ListItem, Text, Stack,
} from '@chakra-ui/react'
import Path from '../../Path'
import Overrides from '../../Overrides'
import Variable from '../../Variable'

export default () => (
  <Variable
    local={{ bg: 'aqua' }}
    name={
      <Stack textAlign="center">
        <Path
          elements={[
            'Mïmis Root from IDX (∅)',
            'org',
            'MetaGame',
            'players',
            'dysbulic',
          ]}
          searched={2}
        />
        <Text>=</Text>
        <Text>ceramic://3</Text>
      </Stack>
    }
  >
    <Variable name="children"
      value={{
        '1Hive': 'ceramic://6…',
        MetaGame: 'ceramic://7…',
        'Raid Guild': 'ceramic://8…',
        SourceCred: 'ceramic://9…',
      }}
      colorFor={(key) => key === 'MetaGame' ? 'yellow' : '#FF000033'}
    />
    <Overrides value={[
      'did:3:4…',
      'did:3:5…',
    ]}/>
  </Variable>
)