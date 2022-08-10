export const verifyNeo4j = () => {
  const vars = [
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'NEO4J_DATABASE',
  ]
  for(const variable of vars) {
    if(!process.env[variable]) {
      throw new Error(`\`\$${variable}\` unspecified.`)
    }
  }
}