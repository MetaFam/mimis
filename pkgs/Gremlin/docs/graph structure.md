# Graph Structure

I am working on a collaborative file system for public information.

The structure is stored in Janus Graph & the data in IPFS.

The structure modeled in the graph database is a copy-on-write unioned graph.

## Roots

There are two separate graphs in the database with different root nodes:

* `Users`: off which there are `INCLUDES` edges, each of which has a unique `author` attribute containing an Ethereum address and connects to a `User` node.
* `Write Layer`: which holds changes to the user's graph which haven't yet been serialized as updates.

## Single & Multiuser Modes

The application can run in two different modes: one for a single user and another for multiple users. In the single user scenario, the `Write Layer` will be the `Spot` at the base of their file system. For multiples, there will be a structure akin to the `Users` node where the `INCLUDES` edges point to per-user `Write Layers`.

This allows single users to begin using the system without requiring setting up an Ethereum wallet.

## Updates

Each `User` node has a set of outgoing `USES` edges which each have a `device` attribute containing a GUID and connecting to an `Updates` node.

The graph is constructed and propagated through the construction of CBOR-DAGs containing subsets of the nodes and edges from the `Write Layer` graph. The update tree is a partial graph growing from the `Write Layer` node. The CID of that tree is included in a header node for the update containing:

* a GUID for the `device` from which the update was published
* a link to the `root` `Spot` for this update
* the CID of the most recent `previous` update from this device
* a `sequence` number identifying how many updates have been published from this device
* a Unix `timestamp` representing the point when the update was created
* an Ethereum `signature` over the `root` CID, `previous` CID, `sequence` number, `timestamp`, & `device` GUID

Updates are made public by broadcasting the author and CID via libp2p. Also, a simple Ethereum contract will contain a map of *`Address`* to a map of uint128 *`Device Id`* to most recently recorded *`CID`*. The link to the previous update for a given device allows clients to follow the chain back and fill in information as necessary.

After the update node is prepared, it is inserted as a child of the `Updates` via a `WRITE` edge and its content tree is added via a `MOUNT` edge to a `Layers` node connected to the `User` node with an `order` of negative of its creation time. The nodes & edges it includes are removed from the `Write Layer`.

*(Because a user's own update is coming from the local database, the entire update will just be migrated to the root element for that `Update`. For updates from other users, however, or from other devices, a `Spot` will initially contain a CID of that node's details in IPFS. The CBOR-DAG is stored with one node per document, and only the documents needed to complete a query will be added to the cache if they haven't been already.)*

## User Graphs

User graphs are `Spot` nodes connected to other `Spot` nodes by `CONTAINS` edges with a `path` attribute, unique per `Spot`, representing an element in the path for resolving a resource.

`Spot` nodes also have a UUID that is set at the point of creation and stays the same across updates.

### Blobs

Each `Spot` can have `REPRESENTATION` edges, which have a `mimetype` attribute that must be unique for that `Spot`.

Each `REPRESENTATION` edge leads to a `Blob` node which has a `cid` property with the IPFS content id of that blob.

When a `Blob` is being added, if there is already `Blob` for that mimetype for the given `Spot`, a `PREVIOUS` edge is made to the existing `Blob`. The `Spot` maintains all the links to previous versions, but the one without an incoming `PREVIOUS` link is the current value for the resource.

### Mounts

In addition to `CONTAINS` edges, `Spot`s can have `MOUNT` edges that either connect to a `Spot` for pinned references that should remain the same across updates, or are floating and connect to a `Mount` node which has a `target` property with the UUID of the target `Spot` and an optional `creator` referencing the Ethereum address of the user's graph this node is in if it is not the current user.

`MOUNT` edges have an optional `order` property, and they are searched in ascending `order` after any `CONTAINS` edges have been checked.

Mounts do allow cycles to exist within the graph, but those will mainly be an issue during dereferencing, where the system will detect them.

### Deletions

When `Spot`s or `Blob`s are removed, they are replaced with a `Tombstone` node in the copy-on-write layer which is then codified in an update.

### Overrides

When a user wants to override a resource in another user's graph, they create a node with that same path under `program → Mïmis → overrides → `*`ETH Address`*.

### Resolution

So, the resolution process for a resource is:

1. Check the `Write Layer` to see if it has the requested path by following `CONTAINS` edges. As each new `Spot` is examined in the search, if it has no properties but a CID, load its characteristics from IPFS.
2. Do a depth-first search of the `Write Layer` traversing any `MOUNT` edges in the path in least first `order`ing.
3. Progress through the `MOUNT` edges in `Layers` and repeat 1 & 2.
4. If the resource isn't found or if a `Tombstone` is encountered before a value in the search, return 404.

When accessing files that are from other users' graphs, search the override graph for that user before searching their `Layers`.

## Future Work

Initial work is focused on providing a proof of concept. Performance concerns will be addressed down the line.

Also, there are plans to stand up a cloud version of the system that will track a wider range of users and provide update information for clients that need it.

Additionally, there is hope to somehow incorporate the [Veilid](https://veilid.com) anonymization layer to permit censorship-resistant publishing.

The current system has no mechanism for truly removing content, only hiding its presence. Something will need to be worked out on that front.
