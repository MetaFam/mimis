# Mïmis

Mïmis is an ambitious project to replace the client/server-based mechanism for distributing content that is HTTP with a P2P oriented solution that maintains a massive shared graph.

## Architecture

The data is Mïmis is custom structured to support a variety of different applications. One of the most fundamental is as a collaborative file system allowing users to:

* maintain individual hierarchical collections of information
* create links to incorporate parts of others' collections into their own

### IPFS

The Interplanetary File System is a distributed hash table for peer-to-peer file sharing. It is used to store both the data in Mïmis & the update information for synchronizing participants' graphs.

### Neo4j

Neo4j is a database which stores a property graph where both the nodes and edges can have associated key/value pairs. It is used to store the context information about the relationships between files.

### Veilid

[Veilid](https://veilid.com) is a protocol for anonymous communication with a plan in its roadmap for a [DHT](https://veilid.gitlab.io/developer-book/concepts/dht.html). Once that exists, the plan is to also use it for storing file information.


