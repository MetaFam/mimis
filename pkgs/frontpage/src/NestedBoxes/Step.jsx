import { Box, Heading } from '@chakra-ui/react'

export default ({ children, title }) => (
  <Box p={5} bg="blue">
    <Heading>{title}</Heading>
    {children}
  </Box>
)