# Graph Structure

I am working on a collaborative file system for public information.

The structure is stored in Janus Graph & the data in IPFS.

The structure modeled in the graph database is a copy-on-write unioned graph.

## Roots

The primary graph starts with a `Users` node off which there are `INCLUDES` edges, each of which has a unique `author` attribute containing an Ethereum address, and connects to a `User` node.

Each `User` node has the possibility of having a `WRITES` edge connecting to a `Write Layer` node which contains a `sequence` number that is incremented every time an update is published and a `device` GUID.

An `IS` edge connects to the root `Spot` from the `Write Layer`.

A `User` also has a `HAS` edge that connects to a `Layers` node which has `MOUNT` edges connecting to the roots of the `Update`s `order`ed by the negative of their creation time.

If a user has never connected an Ethereum wallet, then their changes are stored under the `Write Layer` for the null user: `0x000…`. They are unable to create `Update`s until they connect a wallet so they can sign them.

When a user connects a wallet for the first time, the null user data is moved to the appropriate `User` for that address.

## Updates

Each `User` node has a set of outgoing `USES` edges which each have a `device` attribute containing a GUID and connecting to an `Updates` node.

When preparing an update, an `Update` node is generated independent of the primary graph with an `IS` edge leading to a `Spot` for the root of the update graph. A selection of nodes are moved from the `Write Layer` root graph with the intermediate `Spot`s necessary to connect those nodes to the `root`.

Only one update may be generated at a time, and the generation process runs in a transaction.

A CBOR-DAG with one document per node is generated from the `IS` `Spot` of the update tree, and the value is included in the signature data as `root` while the value is stored on root `Spot` as `cid`. The `Update` node is completed with the following information:

* a GUID for the `device` from which the update was published is pulled from the `Write Layer`
* `cid` of the update itself
* the CID of the most recent `previous` update from this device if such an update exists
* the `sequence` number in the `Write Layer` is incremented and copied to the `Update`
* a Unix `timestamp` representing the point when the update was generated
* an Ethereum EIP-712 typed structure `signature` over the `root` CID, `previous` CID, `sequence` number, `timestamp`, & `device` GUID

Updates are made public by broadcasting the author and CID via libp2p. Also, a simple Ethereum contract will contain a map of *`Address`* to a map of uint128 *`Device Id`* to most recently recorded *`CID`*. The link to the previous update for a given device allows clients to follow the chain back and fill in information as necessary.

After the `Update` node is prepared, it is inserted as a child of the `Updates` via a `SPANS` edge and the root `Spot` is connected via a `MOUNT` edge to a `Layers` node connected to the `User` node with an `order` of negative of its creation time. The nodes & edges it includes are removed from the `Write Layer`.

## Processing Foreign Updates

As mentioned, when an intrasystem `Update` is applied, it is simply added to the user's `Updates` node, & the root is mounted in their `Layers` node.

When an update is coming from another system, the `signature` is used to derive the Ethereum address, and the `device` GUID is used to find the `Updates` node.

Once that node is identified, the incoming chain is followed back through `previous` until reaching the `Update` whose `sequence` is one above the local head for that user & device.  If the `previous` on that `Update` matches the `cid` in the system's last cached `Update` then each of the traversed `Update`s have an `IS` edge added to a `Stub` node with the `cid` from the IPLD node representation, and these same nodes can be added to the user's `Layers`.

If the `cid` and `previous` CIDs don't match, then the `Update` is rejected. Also, if the `timestamp` for the `Update` is earlier than the `timestamp` on the `previous` `Update`, then the `Update` is rejected. If the `timestamp` is in the future, that is also grounds for rejection.

## User Graphs

User graphs are `Spot` nodes connected to other `Spot` nodes by `CONTAINS` edges with a `path` attribute, unique per `Spot`, representing an element in the path for resolving a resource.

`Spot` nodes also have a UUID that is set at the point of creation and stays the same across updates.

### Blobs

Each `Spot` can have `REPRESENTATION` edges, which have a `mimetype` attribute that must be unique for that `Spot` within that `Write Layer` or `Update` graph.

Mimetypes are normalized disregarding any clarifying attributes like `;charset=utf8` for the purposes of uniqueness.

Each `REPRESENTATION` edge leads to a `Blob` node which has a `cid` property with the IPFS content id of that blob.

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

1. Check the `Write Layer` to see if it has the requested path by following `CONTAINS` edges. Each time a `Stub` is encountered, retrieve the associated `cid` & replace the `Stub` with a `Spot`.
2. Do a depth-first search of the `Write Layer` root traversing any `MOUNT` edges in the path in least first `order`ing.
3. Progress through the `MOUNT` edges in `Layers` and repeat 1 & 2.
4. If the resource isn't found or if a `Tombstone` is encountered before a value in the search, return 404.

When accessing files that are from other users' graphs, search the override graph for that user before searching their `Layers`.

## Nodes Summary

| Node | Attributes | Edges |
| --- | --- | --- |
| `Users` | | • `INCLUDES`s with `author` to `User`s |
| `User` | | • `WRITES` to `Write Layer` |
| | | • `USES` with `device` to `Updates` |
| | | • `HAS` to `Layers` |
| `Write Layer` | • `sequence` number | • `IS` to `Spot` |
| | • `device` GUID | |
| `Updates` | | • `SPANS`s to `Update`s |
| `Layers` | | • `MOUNT`s to `Spot`s |
| `Update` | • `device` GUID | • `IS` to `Spot` |
| | • `root` CID | |
| | • `previous` `Update` CID | |
| | • `sequence` number | |
| | • creation `timestamp` | |
| | • EIP-712 `signature` | |
| `Spot` | • `uuid` | • `CONTAINS`s with `path` to `Stub`s or `Spot`s |
| | | • `REPRESENTATION`s with `mimetype` to `Blob`s |
| `Blob` | `cid` | |

## Future Work

Initial work is focused on providing a proof of concept. Performance concerns will be addressed down the line.

Also, there are plans to stand up a cloud version of the system that will track a wider range of users and provide update information for clients that need it.

Additionally, there is hope to somehow incorporate the [Veilid](https://veilid.com) anonymization layer to permit censorship-resistant publishing.

The current system has no mechanism for truly removing content, only hiding its presence. Something will need to be worked out on that front.

Handling the loss or compromise of a key also needs to be dealt with.

One mechanism for providing for the reliability of data is using [Human Passport](https://passport.human.tech) on the user's Ethereum address to reduce Sybils. The popularity of mounted content as well as a rating system can help drive a content recommendation system.

Ideally information could be kept alive for a minimum of cost. Perhaps raising funds through charging for access to the aggregated information in the cloud system to drive large long-term storage in the [Filecoin network](https://filecoin.io) or IPFS accessible pinning in [Fil.One](https://fil.one).
