<script lang="ts">
  import { CarBlockIterator } from '@ipld/car/iterator'
  import { decode } from '@ipld/dag-pb';
  import { stream2AsyncIterator } from '$lib/stream2AsyncIterator'
  import neo4j from 'neo4j-driver'
  import {
    PUBLIC_NEO4J_URI as uri,
    PUBLIC_NEO4J_USER as user,
    PUBLIC_NEO4J_PASSWORD as pass,
  } from '$env/static/public'

  const onSubmit = async (evt: SubmitEvent) => {
    evt.preventDefault()

    const form = (evt.target as HTMLFormElement)
    const file = (
      (form.querySelector('#car') as HTMLInputElement)
      .files?.[0]
    )
    if(!file) {
      throw new Error('No file selected.')
    }
    const reader = await CarBlockIterator.fromIterable(
      stream2AsyncIterator(file.stream())
    )

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, pass))
    const serverInfo = await driver.getServerInfo()
    console.log({ serverInfo })

    for await (const { cid, bytes } of reader) {
      const decoded = await decode(bytes)
      const { Links: raw } = decoded
      const named = raw.filter(({ Name }) => (!!Name))
      if(named.length > 0) {
        const formatted = named.map(({ Name, Tsize, Hash }) => ({
          name: Name, size: Tsize, cid: Hash.toString()
        }))
        console.dir({ [cid.toString()]: formatted }, { depth: null })
      }
    }
  }
</script>

<form onsubmit={onSubmit}>
  <input type="file" id="car" accept=".car" />
  <button>Upload</button>
</form>