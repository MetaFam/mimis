# Claude’s Mïmis

This is a version of the Mïmis file system and browser hallucinated by Claude Opus 4.8.

## File System Structure

Rather than a file and folders analogy, Mïmis is organized as a finite-state transducer. It takes a path as input, does some internal machinations, & spits out the CID of a resource.

So, in a traditional file system the path elements are associated with the nodes *(the labels on files and folders)*. In Mïmis, the path elements are properties of the edges that transition between semantic locations called `Spot`s.

There are several kinds of edges that can exit a `Spot`:

* A `CONTAINS` edge which has a `path` property containing the path element to be consumed when the edge is traversed connecting it to another `Spot`.
* A `REPRESENTATION` edge with links to a `File` which has `cid`, `type`, & `size` properties.
* A `SIGNIFIER` edge which has a `term` property which is an arbitrary string & a `weight` property that varies −1 – +1.
* A `MOUNT` edge representing a member of a union mount. They have an `order` property to specify where they occur in the union.

Files have no name. The path is consumed by traversing edges matching their `path` property. When it terminates that `Spot` can have zero or more `REPRESENTATION` edges, but only one per `type` of `File`.

By pushing all the file information into the path, multiple distinct paths can lead to the same location with no duplication of information.

The overarching architecture of the system is updates are published as trees originating at a `SpotRoot` with one per user based on an Ethereum signature of the root CID.

The `SIGNIFIER` edges serve to create a semantic overlay to contextualize the relationships between `Spot`s.