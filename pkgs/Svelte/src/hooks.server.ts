import { glob } from 'glob'
import { readFile } from 'node:fs/promises'
import { getNeo4j } from '$lib/drivers.ts'

console.info('Running initialization scripts…')

const driver = getNeo4j()
const session = driver.session({ database: 'system' })

try {
  for(const script of await glob('config/init/**.cypher')) {
    try {
      console.debug({ Executing: script })
      const content = await readFile(script)
      const result = await session.run(content.toString())
      console.debug({ result })
    } catch(error) {
      console.error({ Error: (error as Error).message })
    }
  }
} finally {
  await session.close()
}

console.info('Done initializing.')
