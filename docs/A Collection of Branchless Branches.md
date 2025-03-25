The end goal is to represent a versioned filesystem in a graph database.

Conceptually, the structure is much like a traditional directory tree:

* art
  * by
    * Pablo Picasso
      * _The Old Guitarist_
      * _Le Rêve_
      * _La Vie_
  * colored
    * blue
      * _The Old Guitarist_
      * _La Vie_
  * style
    * Impressionistic
      * _The Old Guitarist_
      * _Le Rêve_
      * _La Vie_

The difference is that instead of a single file to be found only in one folder, resources are meant to be found at any reasonable location.

Also, resources are versioned and origins of data are maintained, so we know who entered what piece of data at what location on what date.

We, hopefully, know which pieces of data were combined to produce conglomerates.

I think that what I want is a git remote.

---

Instead of representing file locations as a graph or tree, I was thinking about having a set of single-path branches terminating in a versioned blob.

So, instead of:

![](Example%20Directory%20Forest.svg)

Each path is separate:

![](Example%20Branch%20Decomposition.svg)

One side effect of separating the branches is a Merkleization of the path is the same for all references to the same version, so it is easy to determine who added a particular resource at a particular location.

Also, calculating popularity is a straightforward counting of occurrences of a branch.

It complicates creating a Git endpoint however as that requires computation across all the entries in a directory.

---

In each resource directory, there is a `mimis/resource/json5` that describes the resource in JSON-LD. From this description additional directories can be generated.

---

