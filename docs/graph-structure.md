# Graph Structure

Currently the system is reading in a CAR file and iterating over each of the entries to insert them into a Neo4j instance.

There are three main classes of imported nodes:
* `Content`: Representing a specific series of bytes stored in IPFS. The associated CID is stored as part of the node. The `mimetype` is also optionally stored as well as the `size` of the file. `Content` nodes are leaves in the tree and have no children. It is possible for `Content` nodes to have equivalencies produced by different hashing or chunking algorithms.
* `Context`: Representing directory nodes in the UnixFS file system imported from the CAR file. `Context` nodes contain a CID, & have other `Context` and `Content` nodes as children. The `CONTAINS` relationship has a numeric `order` and a string `under` property specifying the name of the resource in the parent.
* `Mount`:  Representing a tree in which `Connection` nodes are arranged. At each point in the tree, there's an ordered list of zero or more `Connection`s which are searched when resources are resolved.
* `Connection`: Represents the current version of a particular mounted `Context`, and maintains a link to the `PREVIOUS` `Connection` that this one replaced.
