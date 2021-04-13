Mïmisbrunnr
===========

Mïmis is a composed filesystem built from a DAG constructed by walking the path from the root and buliding a set of paths to search.

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

When the node is loaded, the system will check for the existence of `/org/MetaGame/Raid Map/Players/dysbulic/` for the user did:3:kjzl…pfr717. If that node exists, all the paths in that node will be added (overwriting any existing entries) into the current context.

So, in order to customize their representation on the map, a user would define a `svg` entry in the aforementioned directory.