Mïmisbrunnr
===========

Mïmis is a composed filesystem built from a DAG constructed by walking the path from the root and building a set of paths to search.

## Conventions

### No Parent Reference

All locations in the filesystem tree are intended to have all coherent paths for the location resolve. So, for example, all of the following resolve to the same location:

* `/book/by/Ursula K. LeGuinn/The Dispossessed/`
* `/book/by/LeGuinn/The Dispossessed/`
* `/work/anarchist/The Dispossessed/`
* `/book/entitled/The Dispossessed/`
* `/Ursula LeGuinn – The Dispossessed/`
⁝

Because a node is intended to have multiple parent nodes, the parent directory, `../` doesn't necessarily have a single value, and the parent relationship isn't stored in any case.

It means that if a node wants to refer to a parent, it must specify that path up from the root, `/`.

### No File Extensions

All the context information about the nature of a file (other than its type) is stored in the path to the file. The filename is only the type of the file, i.e. `svg` or `html`.

This allows multiple contexts to refer to the same location seamlessly.

## Overrides

For a given node in the filesystem tree, it is possible to specify that additional entries should be merged from another user's Mïmis DAG.

These additional trees are loaded from Ceramic by specifying the DID of the user to access.

## DAG Structure

The nodes in the DAG are of the format:

```
{
  type: 'file' | 'directory',
  children: <map of ceramic URIs>,
  content: <IPFS CID of file contents>,
  overrides: <array of DIDs to check>,
}
```

Where one of either `content` or `children` is specified. So, the root looks something like:

```
{
  type: 'directory',
  children: {
    art: 'ceramic://…',
    org: 'ceramic://…',
    book: 'ceramic://…',
  },
  overrides: [],
}
```

The [MetaGame Raid Map](https://metafam.github.io/raid-map/) is an overview of the projects the organization is working on. The triangles at the center represent players, and they are included in the larger image using SVG `image` tags. The goal is to allow players to customize their representation in the map.

So, for example, the node at `/org/MetaGame/Raid Map/Players/dysbulic/` would be:

```
{
  type: 'directory',
  children: {
    svg: 'ceramic://…',
  },
  overrides: ['did:3:kjzl6cwe1jw14936apxr6lxhewn3srcpxjwjtu777mkfio7718ue8alc7pfr717'],
}
```

When the node is loaded, the system will check for the existence of `/org/MetaGame/Raid Map/Players/dysbulic/` for the user did:3:kjzl…pfr717. If that node exists, all the paths in that node will be added (overwriting any existing entries) to the current context to create a composite.

So, in order to customize their representation on the map, a user would define a `svg` entry in the aforementioned directory.

## Algorithm

1. Start the search queue with the Mïmis root from IDX.
2. Each Mïmis node has an optional ordered list of DIDs of overriding users. If any are specified, add their Mïmis roots to the search queue in the order given for the DIDs.
3. While there is more than one element remaining in the path to be dereferenced, shift the first element and iterate over the search queue, looking for directory nodes that have a child element that matches the current path portion.
4. Each iteration produces a new search queue one level deeper in the tree.
5. If a node has overrides, those overrides are added to the search queue following the element being dereferenced. The node added to the queue is from the same position in the tree as is currently being defreferenced.

## Pathological Cases

Some nodes are pathological in that they have absurdly large contents. For example, `/book/by/<author>/<title>/` where I would like to begin to collect all the world's writing in the form of exploded [EPubs](//www.w3.org/TR/epub-33/). The `by/` directory would have an entry for every name of every author.

Ceramic updates are limited to 256KiB. Some sort of data structure needs to be constructed to hold the hundreds of thousands entries. Some sort of balanced tree. Then, cache it in a system capable of quickly sorting and filtering it.

## Cache Invalidation

When a node changes, only the nodes on the path from it to the root need to be recalculated. *(This may be wrong. It would be true for a Merkle Tree, but I was considering working from XPath. An [XPath expression](//github.com/FontoXML/fontoxpath) can include siblings and text matching and whatnot, so a change in a node could have side effects anywhere in the tree.)*

With Ceramic, nodes will not necessarily change in content, but the value will need to be recached. There is a change listening interface that lets me fix the cache with minimal effort.

## Queue Priority

Instead of being a javascript string DID, an entry in the overrides array can be an object. There are *k* sections (by default 10) sections to the search queue, or it is easier to think of it as there are ten queue which are concatenated one after the other before they are combined.

When the queue is finally being evaluated, the queue is traversed from the beginning and for each name within the resource stack of entries. If the path reference is for a singular entry, the first is returned. ~~Other entries in the queue are accessible using `<path>/<i>/<type>` (i.e. `/funny/1/jpg`) syntax. The queue exposes the property `.length`, and the methods `.forEach` and `.map`.~~

B/c of how the queue is divided, default entries that should be overwritten are placed in earlier sections, and immutable information that should not be overwritten is placed in later ones.

The user could reserve the 10ᵗʰ queue for their own use for information they want guaranteed to be in the final output.

## Styling

File entries have override entries. This allows overriding only a `css` entry. Or, you could search all your contacts for `/funny/1/jpg` and build a composite.

## Sorting

There needs to be some quick interface for doing actions on the queue. One conceptualization of `/funny/[0-9]+/jpg` is a complete ranking of all the "funny" elements the user has been exposed to ever.

A user should be able to quickly:
* unshift an entry to the front of the list
* append an entry to the end of the list
* insert an entry at the 75%, 50%, & 25% points
* switch to a negated version of the current directory, `/¬/funny/` with the same sort options

The goal is to make the sort accurate, semantically nuanced, and fast.

A user should be able to accomplish all tasks using the keyboard.
