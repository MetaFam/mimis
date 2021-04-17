import { OrderedList, ListItem } from '@chakra-ui/react'

export default ({ elements = [], searched = 1, ...props }) => (
  <OrderedList
    textAlign="center"
    style={{ listStyle: 'none' }}
    m={0} p={0}
  >
    {elements.map((elem, idx) => ((()=> {
      if(idx >= searched) {
        props.opacity = 0.25
      }
      return (
        <ListItem
          key={idx} {...props}
          border="2px solid #00000066"
          borderRadius={20}
          p={5}
        >{elem}</ListItem>
      )
    })()))}
  </OrderedList>
)
