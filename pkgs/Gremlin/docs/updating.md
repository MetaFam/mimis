# Updates to Mïmis

The Mïmis file system is made up of `Spot` nodes. Conceptually, they are points in the Nöosphere, the space of all concepts.

They are arranged hierarchically, and that hierarchy is stored in a graph as `path` attributes on `CONTAINS` edges between `Spot`s.

Each `Spot` may have zero or more `REPRESENTATION`s, which is a digital artifact associated with a particular concept. Each `REPRESENTATION` has an associated `mimetype`, and there is only one `REPRESENTATION` of a particular type for a given `Spot`.

Here is a graph representing a simple file system:

![Simple System](basic%20graph.svg)

This can be understood more easily if some extraneous names are removed:

![Simple View of a Simple System](basic%20graph.simplified.svg)

Each user has their own graph, and portions of those are replicated by members of the P2P network. The base structure looks like:

<div align="center">
<img href="base%20graph.svg" style="width: 350; height: auto"/>
</div>

Updates, then, are identified by a CBOR-DAG with a root equivalent to the