import { OrderedList, ListItem } from '@chakra-ui/react'

export default ({ elements = [], searched = 1, ...props }) => (
  <OrderedList
    textAlign="center"
    style={{ listStyle: 'none' }}
    m={0} p={0}
  >
    {elements.map((elem, idx) => ((()=> {
      const attrs = {}
      if(idx === searched) {
        attrs.bg = '#F0FF0F'
        attrs.opacity = 0.5
      }
      if(idx > searched) {
        attrs.opacity = 0.25
      }
      if(idx < searched - 1) {
        attrs.textDecoration = 'line-through'
      }
      return (
        <ListItem
          key={idx} {...props} {...attrs}
          border="2px solid #00000066"
          borderRadius={20}
          p={5}
          title={(() => {
            if(idx === searched - 1) return 'current'
            if(idx === searched) return 'matching'
            if(idx < searched) return 'searched'
            if(idx > searched) return 'pending'
            return 'mystery'
          })()}
        >{elem}</ListItem>
      )
    })()))}
  </OrderedList>
)
