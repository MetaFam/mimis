# Mïmis' Network Structure

Ultimately, I dream of a Mïmis network you feed some data & it efficiently coordinates within itself to guarantee those bytes will be retrievable in the future.

Such an append-only store could be used as a universal repository for humanity's digital history.

## Approaches

### Cooperative

Nodes know that they are collaborating to preserve data. So, when new information is added they publish it's existence along with a proof of its coherence based on the existing graph surrounding the key that signed it's insertion *(it isn't random data inserted in an attack)*. Peers listen for blocks being broadcast & select them at random for caching.

### Adversarial

A peer requests a resource. The chunkmap for that resource is *not* sent. Rather, the peer will receive offers of blocks from other peers, some of which are parts of the requested resource. Peers gossip about who accepted blocks from them. Once a peer has the bulk of a file, the chunkmap is sent allowing the peer to construct the resource.

The issue is, again, resisting attack from someone inserting random blocks to fill the available storage. The cooperative scenario relies on insertions being signed and being able to verify the reliability of the inserter. It would be the root of the chunkmap Merkle Tree that is signed though, so without that how do you avoid attack?
