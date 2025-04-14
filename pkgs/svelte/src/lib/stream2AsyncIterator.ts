/** Convert a `ReadableStream` to an async itrerator.  */
export async function* stream2AsyncIterator(stream: ReadableStream) {
  const reader = stream.getReader()
  try {
    for(;;) {
      const { done, value } = await reader.read()
      if(done) return
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}