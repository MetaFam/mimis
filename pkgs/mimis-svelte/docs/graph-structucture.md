# Mïmis Graph Structure

## Property Graph

The graph structure of Mïmis is stored in Neo4j which holds a “property graph” where nodes and edges have associated labels & key / value pairs.

![Graph Structure](sample%20graph.svg)

Content trees grow from a `Root` node for which there is one for each user as identified by their Ethereum public key used to sign updates.

The first layer of abstraction is a context tree. It is a series of `Collection` nodes connected by `Contains` edges. The edges are where the name of each node is stored, so it is possible to have a collection node with different names based on the path used to reach it.

There are different types of `Contains` edges. There are:
* `Object` edges which are classes of categorized files
* `Discriminator` edges which define a structure for their children
* `Set` edges which draw from collections of data contained in knowledge graphs

A path is dereferenced by walking through the context tree and consuming path elements at each step. At places in the graph where a coherent item is described by the path, for example: `/book/by/Robert Heinlein/A Stranger in a Strange Land/`, there is a `Describes` edge to a `Noöpoint` node *(which is a particular concept from the Noösphere)*. There will frequently be multiple `Represents` edges to a single `Noöpoint` node.

From the `Noöpoint` node, there are `Representation` edges which connect to a `List` node.
