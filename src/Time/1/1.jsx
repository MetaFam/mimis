import loadable from '@loadable/component'
import {
  Text, Stack,
} from '@chakra-ui/react'
import Path from '../../Path'
import Variable from '../../Variable'

const Children = loadable(() => import('./Children'))

export default () => (
  <Variable name={
    <Stack textAlign="center">
      <Path
        elements={[
          '∅(did:3:1…)',
          'org',
          'MetaGame',
          'players',
          'dysbulic',
        ]}
      />
      <Text>=</Text>
      <Text>ceramic://A</Text>
    </Stack>
  }>
    {/* <Children
      value={{
        book: 'ceramic://2…',
        celebrity: 'ceramic://B…',
        geo: 'ceramic://C…',
        porn: 'ceramic://D…',
        org: 'ceramic://4…',
      }}
      selected="org"
    /> */}
  </Variable>
)