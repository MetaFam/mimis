import { Box, Stack, Text } from '@chakra-ui/react'
import Path from './Path'
import HVariable from './HVariable'
import Variable from './Variable'

export default () => (
  <Box>
    <Variable
      name={
        <Text>t<sub>0</sub></Text>
      }
    >
      <Variable
        name={
          <Stack align="center">
            <Path elements={[
              '∅',
              'org',
              'MetaGame',
              'Player',
              'dysbulic',
            ]}/>
            <Text>=</Text>
            <Text>ceramic://1…</Text>
          </Stack>
        }
      >
        <Variable value={{
          overrideDepth: 1
        }}/>
        <HVariable
          name="children"
          value={{
            book: 'ceramic://2…',
            geo: 'ceramic://3…',
            org: 'ceramic://4…',
            player: 'ceramic://5…',
          }}
          propsFor={(key) => (
            { bg: key === 'org' ? 'yellow' : '#0FFFF055' }
          )}
        />
        <HVariable
          name="overrides"
          value={[
            'did:3:1…',
            'did:3:2…',
            'did:3:3…',
          ]}
        />
      </Variable>
    </Variable>
    <Variable
      name={<Text>t<sub>1</sub></Text>}
      local={{}}
    >
      <Variable
        name={
          <Stack align="center">
            <Path
              elements={[
                '∅',
                'org',
                'MetaGame',
                'Player',
                'dysbulic',
              ]}
              searched={2}
            />
            <Text>=</Text>
            <Text>ceramic://1…</Text>
          </Stack>
        }
      >
        <Variable value={{
          overrideDepth: 1
        }}/>
        <HVariable
          name="children"
          value={{
            '1Hive': 'ceramic://6…',
            MetaGame: 'ceramic://7…',
            'Raid Guild': 'ceramic://8…',
            SourceCred: 'ceramic://9…',
          }}
          propsFor={(key) => (
            { bg: key === 'MetaGame' ? 'yellow' : '#0FFFF055' }
          )}
        />
        <HVariable
          name="overrides"
          value={[
            'did:3:4…',
            'did:3:5…',
          ]}
        />
      </Variable>
      <Variable
        name={
          <Stack align="center">
            <Path elements={[
              '∅(did:3:1…)',
              'org',
              'MetaGame',
              'Player',
              'dysbulic',
            ]}/>
            <Text>=</Text>
            <Text>ceramic://A…</Text>
          </Stack>
        }
      >
        <Variable value={{
          overrideDepth: 0
        }}/>
        <HVariable
          name="children"
          value={{
            book: 'ceramic://2…',
            celebrity: 'ceramic://B…',
            geo: 'ceramic://C…',
            porn: 'ceramic://D…',
            org: 'ceramic://4…',
          }}
          propsFor={(key) => (
            { bg: key === 'org' ? 'yellow' : '#0FFFF055' }
          )}
        />
        <HVariable
          name="overrides"
          value={[
            'did:3:6…',
          ]}
          propsFor={(key) => ({
            textDecoration: 'line-through',
            title: 'Override Depth Reached',
          })}
        />
      </Variable>
      <Variable
        name={
          <Stack align="center">
            <Path elements={[
              '∅(did:3:2…)',
              'org',
              'MetaGame',
              'Player',
              'dysbulic',
            ]}/>
            <Text>=</Text>
            <Text>ceramic://A…</Text>
          </Stack>
        }
      >
        <HVariable
          name="children"
          value={{
            book: 'ceramic://2…',
            celebrity: 'ceramic://B…',
            geo: 'ceramic://C…',
            porn: 'ceramic://D…',
            org: 'ceramic://4…',
          }}
          propsFor={(key) => (
            { bg: key === 'org' ? 'yellow' : '#0FFFF055' }
          )}
        />
        <HVariable
          name="overrides"
          value={[
            'did:3:7…',
          ]}
        />
      </Variable>
      <Variable
        name={
          <Stack align="center">
            <Path elements={[
              '∅(did:3:3…)',
              'org',
              'MetaGame',
              'Player',
              'dysbulic',
            ]}/>
            <Text>=</Text>
            <Text>ceramic://A…</Text>
          </Stack>
        }
      >
        <HVariable
          name="children"
          value={{
            geo: 'ceramic://5…',
            philosophy: 'ceramic://5…',
            personal: 'ceramic://5…',
            porn: 'ceramic://6…',
            wares: 'ceramic://5…',
          }}
          propsFor={(key) => (
            { bg: key === 'org' ? 'yellow' : '#0FFFF055' }
          )}
        />
      </Variable>
    </Variable>
  </Box>
)