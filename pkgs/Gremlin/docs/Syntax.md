# Mïmis Syntax

## Union Mounts

A union mount involves layering several file systems over each other. Files in identical locations are overridden by the “highest” occurrence.

All of the layers below the top are allowed to be immutable. Only read-only access is needed if the system does “copy-on-write” & duplicates a file to the top layer when it is written to.

Mïmis uses union mounts with a single entry as a symlink.

## Account Trees

Each user has their own root off the `Account Trees` root node.

When an update is published, it is as CBOR-DAG stored in IPFS. Each node in the graph is a separate IPFS CBOR document with:
* `label: string`
* `properties: Array<KVPair>`
  * `key`
  * `value`
* `relations: Array<Relation>`
  * `properties: Array<KVPair>`
  * `destination: CID`

An update's header consists of two nodes:

1. a context node that shows where to position the node in the tree using:
  * the root CID of a CBOR-DAG originating at the root of the user's tree off the `Account Trees` root
  * the CID of the update immediately before this one

2. an tree identifier node consisting of:
  * the CID of node #1
  * an Ethereum signature over that CID

With the Ethereum signature & signed text, it is possible to derive the Ethereum account which created the signature. That address is used to identify the `Account Trees` child stored as the `account` property on the edge between the `Account Trees` & the `Root` node of the associated tree.

## Incorporation

Users can "incorporate" portions of other users trees. An `INCORPORATION` edge is between `Spot`s & either `Spot`s or `File`s mounted in the users' personal graph, at the least at, `/program/mïmis/∅/Account Trees/-account: <Ethereum Address>→/~Root~(/-path→/~Spot~/)*-mimetype→/File`. The user can make `INCORPORATION` links into that account tree.

An `INCORPORATION` edge is a union mount with the destination, but also an empty upper. This allows a user to selectively overwrite files in the others' project. "Copy-on-write" is accomplished via a `PREVIOUS` link to the overwritten file.

When serving a resource, the uppermost file is tunneled from IPFS to originate from Mïmis’ domain so that relative resources will be requested through Mïmis. *(Though, perhaps something simpler could be achieved using a service worker.)*

Because each CBOR node is a separate IPFS document, it is possible to only load the portions of the trees that the users want to incorporate.

Every update includes a path from the root to whatever files are contained in that set. Some initial set of path steps will be a single option leading from the root to wherever the project is located.

## Recursive Roots

In the path description format, if the path begins with `∅` then the path separator is `↣` & any time a `∅` is encountered in the path it means: "Check if that symbol is defined in the current directory and search it if so, but go to the absolute root if nothing matches."

This lets users specify links to libraries in such a way that they can still override individual files within them.

## Authoritative Resolutions

If a given path `∅↣x↣y↣z↣` is an inclusion of other tree, what is the correct resolution to use? More than one user may have defined `∅↣x↣y↣z↣`.

Each time a changeset is committed on a node, an [update](Updating.md) is generated & the head of the update header is broadcast to IPFS's pub/sub network.

There is a cloud-based instance of the graph that is incorporating trees from users based on the [Humanity Score](https://huimanity.tech) of the associated Ethereum address. Each verified user's tree will link to different resources at different locations either directory or inadvertently by using someone else's graph.

The correct resolution is found by simply choosing the most popular.

## Merges

When an update is applied, there may be inclusions in the supplanted graph. Inclusions can be set to automatically or manually update depending on the situation for the project.