# Μïmis

This project aims to build a universal file browser.

The goal is to be user configurable, but rely primarily on two different strategies for combining trees:

1. Merging: Two trees are joined at an intersecting node. There are three options for collisions: keep the original, replace it, or, somehow, make both options available.

  I suspect different kinds of interactions will be appropriate for different situations.

  For example, you might want to have a sort of root filesystem which provides the interface and logic. Those paths might override any subsequent ones.

  In the case of a theme, you might want later paths to supercede, like CSS.

  A user browsing might want to see what their various options are to complete a particular path.

  The important factor is this is interface composition in terms of tree intersections rather than replacements. It addresses the same basic problem as React's virtual DOM.

2. Collaboration: Users would be able to validate paths and include them in their personal tree. Optimum composite paths are found by counting the number of paths to a node.

  This is, of course, open to a Sybil attack. A potentially effective method I'm interested in exploring is using the [voter registration roles](http://voterlist.electproject.org) to mail verification codes.

  The onus on the user is just entering their address and getting some mail, but it makes creating a fradulent account requiring several felonies.

# Implementation

## Storage

The file data is stored in [IPFS](//ipfs.io). The path index is stored in, currently Cloudant for speed reasons, but testing is also being done locally using PouchDB.

IPFS provides a pool of uniquely identified data & CouchDB a pool of globally identified objects. The goal is to build data structures by linking in the second to the first.

This is accomplished in part by a linking system that allows conglomerating content and metadata. It takes advantage of the fact that a given directory structure produces a unique hash which can be computed by any party to associate related pieces of data.

It relies on a base semantic graph. For example:

`/book/by/Ursula K. Leguin/A Wizard of Earthsea/`

This sort of structure is inherently ambiguous and a large part of the system is figuring out what to show the user when they view a particular space.

Regardless, the aim is to be able to publish links and associate metadata with that "path".

One of the goals is for the system to be sneakernet-friendly. Ultimately, I envision two Iranians touching their phones sitting in a café. IPFS syncs in the background and Μïmis incorporates that data into a meaningful user experience.

Users should be able to dedicate a portion of their storage to preservation and whereas pinning saves the entire file, preserving randomly pins subsections of all the preserved data.

## Use Cases

The first interface I would like to build is for [Project Gutenberg](//gutenberg.org).

Their corpus of 60k+ works is available via [rsync](bin/gutenberg.sh). The content is stored by id in a directory structure of the format:

* `1/2/3/1234`
* `1/2/3/4/12341`

HTML files, if they exist, are in a subdirectory: `1/2/3/1234/1234-h/`.

The first task is to import that filesystem into IPFS ([QmTGcsAY1t3r5TWp5QrBZevW1h5qam2G7SBYptq4orGJgr](ipfs://QmTGcsAY1t3r5TWp5QrBZevW1h5qam2G7SBYptq4orGJgr)), and a [web app](//forets.web.app) to spider that hash and import it into a CouchDB instance.

The CouchDB objects from this import are divided into context and content based on the presence of a specifically-named text file marking content directories. The format of a context node is:

    {
      // "Quote" slashes by doubling them to prevent injection attacks
      _id: path.map(p => p.replace('/', '//')).join('/') + '/',
      type: 'context',
      // path is an array of the current directory structure starting with the root hash
      path: path ? path : [key],
      // The branch id is the IPFS hash for a directory tree containing only the desired path.
      branch_id: ipfs.rmdir('...') && ipfs.mkdir(['...', ...path]) && ipfs.ls('...').hash,
      ipfs_id: key,
    }

Content objects are:

    {
      _id: path.map(p => p.replace('/', '//')).join('/'),
      type: 'content',
      // Path begins with the ipfs id of the containing folder
      path: path,
      branch_id: ipfs.rmdir('...') && ipfs.mkdir(dir = ['...', ...path[0..-1]) && ipfs.touch([...dir, path[-1]) && ipfs.ls('...').hash,
      ipfs_id: key,
    }

Contextualizations are:

    {
      // others have slashes in their ids, so there shouldn't be collisions
      // ids are branch ids
      _id: `ctxn:${context_id}:${content_id},
      type: 'ctxn',
      context_id, content_id,
    }

Contexts are added both for path beginning with the root hash and for the path without it.

The result is an interface that can autocomplete on the filesystem, but the directory names are meaningless. I would like to remedy this without touching the Gutenberg mirror and without tying it to a specific hash.

The first step was parsing the `GUTINDEX` files for the author and title.

    {
      _id: `link:${source_id}:${destination_id},
      type: 'link',
      source_id, destination_id,
    }

# Goals

Eventually the app aims to be very thorough in tracking which media a user consumes and the quantities of time spent consuming.

Creators would be able to specify desired compensation rates in absolute or per time units. Consumers would not be required to pay to consume, but a tally would be kept and presented describing the costs the creators consider reasonable.

For payments, I am particularly interested in [IOTA](//iota.io). The structure is vastly more energy efficient and doesn't require external support to create transactions.

Also, tracking data could go toward creating graphs that aid in the collaborative filtering of paths.

Ultimately, the structure I envision is a flow graph where the nodes with the max flow are prioitized for viewing.