import { glob } from 'glob'
import { readFile } from 'node:fs/promises'
import { getNeo4j } from "./lib/drivers.ts";

console.info('Running initialization scripts…')

const driver = getNeo4j()
const session = driver.session()

try {
  for(const script of await glob('config/init/**.cypher')) {
    console.debug({ Executing: script })
    const content = await readFile(script)
    await session.run(content.toString())
  }
} finally {
  await session.close()
}

console.info('Done initializing.')
