# Updates to Mïmis

## User Graphs

Each user has their own graph, and portions of those are replicated by members of the P2P network. The base structure looks like:

![Base Graph](base%20graph.svg)

Updates, then, are identified by:

* a CBOR-DAG root
* the previous update CID
* an Ethereum block hash and height
* an Ethereum signature over the previous fields

If the included previous update cid doesn't match the current one, then that CID is resolved, and the previous update in that is checked. The process repeats for some limited number of iterations and fails thereafter.

  A `PREVIOUS` edge is added between the current update & the previous one. This creates a backwards linked list where resources can be resolved by beginning with the entry with no `PREVIOUS` entries, searching it for a resolution, and working their way back along the incoming `PREVIOUS` edges until a node has no `PREVIOUS` incoming.

To simplify conflict resistance, Mïmis is an append-only store. There are plans for cache nodes in the tree which represent the results of combining all the updates for that location.

I'm contemplating a scheme for incremental expansion of caches.

Each node in an update contains the nodes properties & a list of outgoing propertied edges where the destination node is a CBOR IPFS link via CID.

## `Spot`s

The Mïmis file system is made up of `Spot` nodes. Conceptually, they are points in the Nöosphere, the space of all concepts.

They are arranged hierarchically, and that hierarchy is stored in a graph as `path` attributes on `CONTAINS` edges between `Spot`s.

Each `Spot` may have zero or more `REPRESENTATION`s, which is a digital artifact associated with a particular concept. Each `REPRESENTATION` has an associated `mimetype`, and there is only one `REPRESENTATION` of a particular type for a given `Spot`.

Here is a graph representing a simple file system:

![Simple System](basic%20graph.svg)

This can be understood more easily if some extraneous names are removed:

![Simple View of a Simple System](basic%20graph.simplified.svg)

*(There is a table of extensions such that if a path ends in an known extension, if the parent has a resolution of the associated mimetype, that resource is returned. So, the "`svg`" paths are causing the `image/svg+_xml` resource to be returned from the previous `Spot`.)*

## Updates

### Adds

Updates may do three things. One is to add new paths. Consider the following graph:

![Add Edge Update](update.add%20edge.svg)

The update information at the bottom integrates into the the resolution like so:

![Simple View of Add Edge Update](update.add%20edge.simplified.svg)

### Edits

Like above, but replace an existing entry.

### Deletes

Edit an entry to point to a `Blackhole` node.

## Caching

The first step is to backwards traverse the `PREVIOUS` links to find the current update CID.

For the given resource path, take the first token and step to that node in the update graph. If that location doesn't exist in the more recent import, create it *(¿where exactly?)*.

If a `Cache` node doesn't exist, create one associated with a `TRAVERSAL` edge.

Work your way backward from the current CID adding all the resources in the update and step from its root using the first token of the path for each update, *unless* that path is already present, in that case discard it.

Once this process is complete, the cache node holds the result for any traversal of the entire list.

If a `Cache` node is present then perform the above process, but stop processing at the first node with a `Cache` node,       incorporating its state.

### Efficiency

I'm particularly interested in the amount of information that has to be transmitted for the graph to stay in sync.

To complete a query, a cache is formed which represents the outcomes for a complete traversal of the tree by visiting each update in reverse chronological order and adding its entries *if* those do not already exist. This need only progress until another node with a cache is reached, that can then be used to fill in the rest of the traversal.

So far as contemplating data usage, how frequently a cache is computed, and thus how far back the system has to look is a function of the last time that path was requested. So, the more popular a query, the more caches are likely to be found.

Given the frequent exponential long tail falloffs of content interest, the bulk of queries could be quick.

### Sustenance

I'd like to get the service to the point a cloud-based instance could sustain itself using x402.

I envision a system where a user has a wallet with the service & parameters such as the maximum to spend without authorization. The frontend could prevent extracting more than the wallets worth.

If a query is likely to exceed the spending limit, the user is informed and allowed to choose.

I'm leaning toward [JanusGraph](https://janusgraph.org) as the database provider. It ticks the boxes & seems like a mature project. Supposedly one of the advantages of Gremlin is I can switch it relatively easily.

I'm going to *(2025⁄12⁄15)* post to their Discord and ask if they have anything like Neo4j's query estimator. Really, it is a function of figuring out which caches have to built & that is only discovered one cache at a time since what the next token resolves to is a function of that cache.

## Future

By adding a cryptographic ownership model over the `Spot`s, I would like to implement a recommended payment option for the media we consume.
