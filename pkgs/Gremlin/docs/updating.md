# Updates to Mïmis

The Mïmis file system is made up of `Spot` nodes. Conceptually, they are points in the Nöosphere, the space of all concepts.

They are arranged hierarchically, and that hierarchy is stored in a graph as `path` attributes on `CONTAINS` edges between `Spot`s.

Each `Spot` may have zero or more `REPRESENTATION`s, which is a digital artifact associated with a particular concept. Each `REPRESENTATION` has an associated `mimetype`, and there is only one `REPRESENTATION` of a particular type for a given `Spot`.

Here is a graph representing a simple file system:

![Simple System](basic%20graph.svg)

This can be understood more easily if some extraneous names are removed:

![Simple View of a Simple System](basic%20graph.simplified.svg)

*(There is a table of extensions such that if a path ends in an known extension, if the parent has a resolution of the associated mimetype, that resource is returned. So, the "`svg`" paths are causing the `image/svg+_xml` resource to be returned from the previous `Spot`.)*

Each user has their own graph, and portions of those are replicated by members of the P2P network. The base structure looks like:

![Base Graph](base%20graph.svg)

Updates, then, are identified by a CBOR-DAG root, a previous update CID, and an Ethereum signature.

If the included previous update cid doesn't match the current one, they that CID is resolved, and the previous update in that is checked. The process repeats for some limited number of iterations and fails thereafter.

A `PREVIOUS` edge is added between the current update & the previous one. This creates a sort of linked list where resources can be resolved by beginning with the entry with no `PREVIOUS` entries, searching it for a resolution, and working their way back along the incoming `PREVIOUS` edges.

Updates may do three things. One is to add new paths. Consider the following graph:

![Add Edge Update](update.add%20edge.svg)
