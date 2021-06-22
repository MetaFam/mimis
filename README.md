Mïmisbrunnr
===========

Mïmis is a filesystem built by processing doubly-linked lists of JSON-LD documents into a Neo4j property graph structure. For example, if the following document came through the pipeline:

```javascript
{
  '@context': 'http://schema.org',
  '@type': 'Book',
  '@id': 'data://hash/sha256;base64,KN…k=',
  sameAs: 'https://en.wikipedia.org/wiki/The_Catcher_in_the_Rye',
  url: 'ipfs://Qm…?filetype=application/epub',
  name: 'The Catcher in the Rye',
  author: {
    '@type': 'Person',
    givenName: 'Jerome',
    additionalName: 'David',
    familyName: 'Salinger',
    name: 'J.D. Salinger',
  },
  participant: {
    '@type': 'Action',
    object: {
      '@id': '∅/award/National Book Award/Fiction/',
      name: 'National Book Award for Fiction',
    },
    result: { name: 'Finalist' },
    startTime: { startDate: '1952' },
    endTime: { startDate: '1952' },
  }
}
```

The handler for the `Book` context would be instantiated & it would create a graph of the form:

![Book Ingestion](public/book%20ingest.svg)

## Use Cases

### Ancillae

Each user prepares a list of written works they found most foundational to enabling them to navigate the world.

Those lists are combined into a composite map that shows the popularity of various titles.

The idea could be abstracted to any content type. Users create structures of the form `/top/movies/1` with the Ceramic URI from `/movie/A Clockwork Orange/`. That location contains metadata that allows the system to display `/top/movies/` coherently.

### Tipping

The system can track which users (DIDs) are responsible for their content and dispense recompense.

I would like to create a system for recompensing the providers of data, and also create metadata such that creators can be compensated as well.

### MetaGame's Raid Map

The [Raid Map](//metafam.github.io/MetaFam/raid-map/) is a visualization of a group of projects and the associated participants.

I want to allow users and projects to override their portion of the image to produce a composite from many authors.

### Overriding Styles

The system should allow you to specify an override for any position in the tree. This means that you could allow anyone to contribute a revised sytlesheet for any site.

If you're anywhere in the net and don't like how something looks, you can change it. You can also publish your changes to others and they can spread virally.

### [Yggdrasil](//github.com/dhappy/yggdrasil)

A gamification of the supply chain based on 13 teams which cover all aspects of consumption.

## Conventions

### No Parent Reference

All locations in the filesystem tree are intended to resolve for all coherent paths. So, for example, all of the following resolve to the same location:

* `/book/by/Ursula K. LeGuinn/The Dispossessed/`
* `/book/by/LeGuinn/The Dispossessed/`
* `/work/anarchist/The Dispossessed/`
* `/book/entitled/The Dispossessed/`
* `/Ursula LeGuinn – The Dispossessed/`
⁝

Because a node is intended to have multiple parent nodes, the parent directory, `../` doesn't necessarily have a single value, and the parent relationship isn't stored in any case.

It means that if a node wants to refer to a parent, it must specify that path up from the root, `/` or creating a direct reference as a child of the current location: `parent/` → `../`.

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

Where one, either, or both of `content` and `children` is specified. A node may be dereferenced in a content context, such as when building a filesystem. In that case the data from the `content` property is used. So, the root looks something like:

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

## Raid Map

The [MetaGame Raid Map](https://metafam.github.io/raid-map/) is an overview of the projects the organization is working on. The triangles at the center represent players, and they are included in the larger image using SVG `image` tags. The goal is to allow players to customize their representation in the map.

So, for example, the node at `/org/MetaGame/players/dysbulic/` would be:

```
{
  type: 'directory',
  children: {
    svg: 'ceramic://…',
  },
  overrides: ['did:3:kjzl6cwe1jw14936apxr6lxhewn3srcpxjwjtu777mkfio7718ue8alc7pfr717'],
}
```

When the node is loaded, the system will check for the existence of `/org/MetaGame/players/dysbulic/` for the user `did:3:kjzl…pfr717`. If that node exists, all the paths in that node will be added (overwriting any existing entries) to the current composite context.

So, in order to customize their representation on the map, a user would define `/org/MetaGame/players/dysbulic/svg` in their directory.

## Algorithm

1. Start the search queue with the Mïmis root from IDX, a path as an array of strings, and a descendDepth equal to the number of user references you wish to follow. If `descend = 0`, only information from your tree will be loaded. If `descend = 1`, your information and the direct users you specified will be referenced.
2. If `children` exists on the root, and if it has an entry that matches the current element if the path, then add a child to the search tree for the dereferenced value of the entry with the path progressed one element. Keep `descend` the same in the child.
3. If `overrides` exists on the root, and if `descend > 0`, add a child to the search tree for the Mïmis root from IDX for each of the listed DIDs with the base path. Decrement `descend` for the children.
4. For each child added in #2 and #3, process as a new root using #1 until the path is exhausted.
5. Once the expansion is complete, determine whether the URI is being dereferenced as a resource or a collection. As a resource, deliver the first (or most popular, or whatever), but some single resource. As a collection, deliver a JSON object describing the results of the search process, or, eventually, an interface for managing those collections and enhanching them with metadata in the form of new paths.

## Pathological Cases

Some nodes are pathological in that they have absurdly large contents. For example, `/book/by/<author>/<title>/` where I would like to begin to collect all the world's writing in the form of exploded [EPubs](//www.w3.org/TR/epub-33/). The `by/` directory would have an entry for every name of every author.

Ceramic updates are limited to 256KiB. A secondary data structure needs to be constructed to hold the hundreds of thousands entries – some sort of balanced tree. Then, for browsing, cache it in a system capable of quickly sorting and filtering it.

### Shattering

As a solution, I would like to create nodes that represent a tree structure within Mïmis. Entries are added to a node until it reaches capacity. At that point it "shatters" and replaces it's list with a set of children partitioning the search space.

## Cache Invalidation

When a node changes, only the nodes on the path from it to the root need to be recalculated. *(This may be wrong. It would be true for a Merkle Tree, but I was considering working from XPath. An [XPath expression](//github.com/FontoXML/fontoxpath) can include siblings and text matching and whatnot, so a change in a node could have side effects anywhere in the tree.)*

With Ceramic, nodes will not necessarily change in content, but the value will need to be recached.

## Queue Priority

Instead of being a javascript string DID, an entry in the overrides array can be an object. There are *k* sections (by default 20: -9‒9) sections to the render tree, which, because the combination is is done using a preorder traversal, are concatenated one after the other overridding lower numbered sections.

Because of how the tree is divided, default entries that should be overwritten are placed in earlier sections, and immutable information that should not be overwritten is placed in later ones.

The user could reserve the +9ᵗʰ queue for information they want guaranteed to be in the final output.

## Styling

File entries have override entries. This allows overriding only a `css` entry.

## Sorting

There needs to be some quick interface for doing actions on the queue. One conceptualization of `/funny/[0-9]+/jpg` is a complete ranking of all the "funny" elements the user has been exposed to ever.

A user should be able to quickly:
* unshift an entry to the front of the list
* append an entry to the end of the list
* insert an entry at the 75%, 50%, & 25% points
* switch to a negated version of the current directory, `/¬/funny/` with the same sort options

The goal is to make the sort accurate, semantically nuanced, and fast.

A user should be able to accomplish all tasks using the keyboard.
