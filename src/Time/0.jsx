import loadable from '@loadable/component'
import { Text, Stack, Path } from '@chakra-ui/react'

const handlers = (
  ['Children', 'Path', 'Overrides', 'Variable'].map((c) => {
    const component = loadable(() => import(`./${c}`))
    window && (window[c] = component)
    return component
  })
)

export default () => (
  <handlers.Variable name={<Text>t<sub>0</sub></Text>}>
    <handlers.Variable name="Search Queue">
      <handlers.Variable
        local={{ bg: 'aqua' }}
        name={
          <Stack textAlign="center">
            <Path elements={[
              'Mïmis Root from IDX (∅)',
              'org',
              'MetaGame',
              'players',
              'dysbulic',
            ]}/>
            <Text>=</Text>
            <Text>ceramic://1</Text>
          </Stack>
        }
      >
        <handlers.Children
          value={{
            book: 'ceramic://2…',
            geo: 'ceramic://3…',
            org: 'ceramic://4…',
            player: 'ceramic://5…',
          }}
          colorFor={(key) => key === 'org' ? 'yellow' : '#FF000033'}
        />
        <handlers.Overrides value={[
          'did:3:1…',
          'did:3:2…',
          'did:3:3…',
        ]}/>
      </handlers.Variable>
    </handlers.Variable>
  </handlers.Variable>
)