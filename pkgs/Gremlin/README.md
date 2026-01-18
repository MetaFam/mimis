# Mïmis

Mïmis is an ambitious project to replace the client/server-based mechanism for distributing content that is HTTP with a P2P oriented solution that maintains a massive shared graph.

## Architecture

Initially, Mïmis is focused on making available public resource, and relies on a couple existing projects to manage its state.

### Data Storage

#### IPFS

The Interplanetary File System is a content-addresses distributed hash table for peer-to-peer file sharing. It is used to store both the data in Mïmis & the update information for synchronizing participants' graphs.

#### Veilid

[Veilid](https://veilid.com) is a protocol for anonymous communication with a plan in its roadmap for a [DHT](https://veilid.gitlab.io/developer-book/concepts/dht.html). Once that exists, the plan is to also use it for anonymous storage of file information.

### Structural Storage

#### TinkerPop

Data is stored in a [TinkerPop](https://tinkerpop.apache.org)-compatible database which is qureried using Gremlin.

IPFS deals specifically with directed **acyclic** graphs. Preventing cycles in the complex mass of interconnected paths that is Mïmis is essentially impossible, and so the acyclic data structures from IPFS are used to create more complex potentially cyclic ones in the database.

##### Debugging

Setting up JanusGraph & the Gremlin console takes some specialized commands, so those are noted here for ease of access…

If running for the first time, use:

```bash
docker run --name janusgraph -p 8182:8182 janusgraph/janusgraph:latest
```

If the JanusGraph image is already present in Docker *(use `docker image ls` to verify)*, use:

```bash
docker start --attach janusgraph
```

Once, JanusGraph is running, you can connect a Gremlin console using:

```bash
docker exec -e GREMLIN_REMOTE_HOSTS=janusgraph -it janusgraph bin/gremlin.sh
```

Within the Gremlin console, you connect to the running JanusGraph instance using:

```gremlin
g = traversal().withRemote('conf/remote-graph.properties')
```

As with most containers, if you just want to poke around the file system:

```bash
docker exec -it janusgraph /bin/bash
```


## Use Cases

The data is Mïmis is custom structured to support a variety of different applications.

### Collaborative File System

One of the most fundamental is as a collaborative file system called Argus allowing users to:

* maintain individual hierarchical collections of information
* create links to incorporate parts of others' collections into their own
* suggest updates to others' resources
* represent resources which served as sources for a work

#### Graph Structure

The most basic idiom in Argus is a directory tree. Nodes in the tree represent conceptual points in the space of all ideas. *(In the system, these nodes are “nöopoints” where the sum of all concepts is Vernadsky's “nöosphere”, though they are refered to, for simplicity sake, as “Spot”s.)* The edges between nodes contains the path elements which are associated with folders in a traditional file system.

![basic graph structure](docs/basic%20graph.svg)

Unlike a regular file system where the bulk of the identifying description is in the name of the file, in Argus a Spot may have files of different types associated with it, but the file has no name so to speak. All the identifying information is in the path, & this allows multiple paths to resolve to the same resource without duplicating information. Eventually, ideally, all reasonable paths would resolve correctly.

Path trees, when published, are signed with an Ethereum keypair, and, within the larger system which is Mïmis, they are stored off a `Root` node by `ACCOUNT` edges with a `signer` values. Whenever a new path element or nöopoint is added, it contains the following identifiers:

* the creation timestamp
* the update timestamp
* multihashes of the path name relative to the local root
* the address of the author

Path trees, then, are anchored according to those characteristics. Each specifies a root that already exists in the tree.

##### Tree Aggregation

In addition to the nöopoints, the path trees also contain mount nodes which connect a path to an existing subtree elsewhere, be it in their own tree or someone else's. The mounts are "union mounts" where several subtrees can be mounted at the same place, and their contents add to each other.

##### Consensus View

One crucial view of the data is formed by analyzing the graphs as a whole filtered using an Sybil guard like [Human Passport](https://passport.human.tech). In this larger graph which resource is appropriate for a given path is determined by examining how many verified accounts link to it.

##### Versioning

As files are added in locations where there is already an entry, an edge is added from that entry to the previous one, so that the current entry is the one without such a link, but all previous versions can still be accessed.
