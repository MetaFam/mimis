import loadable from '@loadable/component'

const Variable = loadable(() => import('../Variable'))

export default ({ ...props }) => (
  <Variable
    name="overrides"
    local={{
      border: '2px solid black',
      bg: 'teal',
    }}
    {...props}
  />
)