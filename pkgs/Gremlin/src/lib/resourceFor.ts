import {
  connect as connectJanusGraph, connectToG,
} from '$lib/janusgraph.ts'
import { spotId } from '$lib/spotId.remote.ts'
import { isError, viewable } from '$lib'

export async function resourceAt({
  containerId, type,
}: {
  containerId: number
  type: string
}) {
  const connection = connectJanusGraph()

  try {
    const g = connectToG(connection)
    const traversal = (
      g.V(containerId)
      .outE('REPRESENTATION')
      .has('type', type)
      .inV()
      .values('cid')
    )
    const result = await traversal.next()
    return result.value
  } finally {
    connection.close()
  }
}

export async function resourceFor(
  { path }: { path: Array<string> }
) {
  if(viewable(path.at(-1))) {
    const spot = await spotId({ path })
    console.debug({ spot })
    if(spot != null && !isError(spot)) {
      return { cid: await resourceAt({
        containerId: spot,
        type: 'image/svg+xml',
      }) }
    }
  }
  return null
}