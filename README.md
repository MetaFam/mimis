Mïmisbrunnr
===========

Mïmis is a composed filesystem built from a DAG constructed by walking the path from the root and buliding a set of paths to search.

Override paths are specified in terms of an XPath, and a list of DIDs of user trees to search. The overrides are modeled after XSLT's template system. If the current node is matched by the applicabiity XPath then the accompanying function is run to retrieve the associated DIDs. Something along the lines of:

```
<Override match='/art/by/dysbulic/'>
  () => 'did:3:kjzl6cwe1jw14936apxr6lxhewn3srcpxjwjtu777mkfio7718ue8alc7pfr717'
</Override>
```

Or, for the [Raid Map](https://metafam.github.io/raid-map/), the idea is to allow players to override their image from around the center of the map. The map SVG contains an `image` tag which references the default player image at `Player/<eth address>.svg`.

Overrides may be added from a given node in the path, but they can only be applied to paths under the node where they were added. So, for the Raid Map, when `.../org/MetaGame/Raid Map/` is traversed, overrides are added of the form:

```
<Override match='Players/./'>
  ({ path }) => {
    const username = path.replace(/^.+\/([^/]+)\/?$/, $1)
    export const PlayerFragment = gql`
      fragment PlayerFragment on player {
        username
        ethereum_address
      }
    `
    const playerQuery = gql`
      query GetPlayer($username: String!) {
        player(where: { username: { _eq: $username } }) {
          ...PlayerFragment
        }
      }
      ${PlayerFragment}
    `
    const client = createClient({
      url: 'https://api.metagame.wtf/v1/graphql',
      suspense: false,
    })
    const { data } = await (
      client
      .query(playerQuery, { username })
      .toPromise()
    )
    const ethAddr = data?.player[0].ethereum_address
    const createCeramic = async (url = 'https://ceramic-clay.3boxlabs.com') => {
      const ceramic = new Ceramic(url)
      ceramic.didFor = async (addr) => (
        (await ceramic.createDocument('caip10-link',
          { metadata: {
            family: 'caip10-link',
            controllers: [`${addr.toLowerCase()}@eip155:1`],
          } }
        )).content
      )
      return Promise.resolve(ceramic)
    }
    const ceramic = await createCeramic()
    return await ceramic.didFor(ethAddr)
  }
</Override>
```
