import { Box, Heading, Text, Link as ChakraLink } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

const Para = ({ children, ...props }) => (
  <Text style={{ textIndent: 20, textAlign: 'justify', marginBottom: 10 }} {...props}>
    {children}
  </Text>
)

export default () => (
  <Box maxW="35rem" margin="0 auto">
    <Heading align="center" m="1rem"><ChakraLink href="https://github.com/MetaFam/mimis/">Mïmis</ChakraLink></Heading>
    <Para>The Noösphere is the category of all thought. Its objects are all things that can be thought about. Each point is unique and can be referred to by multiple contexts.</Para>
    <Para>Mïmis is for refining the context forests for a noöetic point. It is also for the resolution of resources by combining trees from multiple users.</Para>
    <Para>The system is currently in the design phase and this repository contains a <Link to="/mock">sample visualization of the resolution process</Link>.</Para>
  </Box>
)