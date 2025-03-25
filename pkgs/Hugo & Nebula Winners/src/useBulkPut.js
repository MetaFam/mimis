import { useDB } from 'react-pouchdb'

export default () => {
  let queue = []
  const MAX_SIZE = 50000
  const db = useDB()

  const bulkPut = (obj) => {
    new Promise((resolve, reject) => {
      console.log('Queuing', queue.length)
      queue.push(obj)
      if(queue.length >= MAX_SIZE) {
        await flushQueue()
      }
      resolve()
    })
  }

  const flushQueue = async () => {
    console.log('Flush Queue')
    await db.bulkDocs(queue)
    queue = []
  }

  return [bulkPut, flushQueue]
}