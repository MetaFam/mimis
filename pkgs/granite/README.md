# Mïmis Granite

The most technologically incomplete version of Mïmis possible while still retaining the character.

A graph database formed of union mounts of linked trees promulgated using IPFS CBOR-DAGs.

## Architecture

A graph consists of a set of union mounted updates. Each node in an update is a separate IPFS document with the relationships containing the properties of the edge and a link to the CID of the child node.

Updates identified by a root CID, and are published broadcast via libp2p Gossipsup and an Ethereum map. Each update contains a link to the most recently published previous update from that node.

Each node should have its own publishing key. Multiple publishing nodes can be conglomerated through the union mounting system to form user directories.

Updates are all published relative to the same node — a universal root specific to each publishing key.

