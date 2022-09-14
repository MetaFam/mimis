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