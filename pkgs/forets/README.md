![](public/header.svg)

# 𝔐𝔦̈𝔪𝔦𝔰

𝔐𝔦̈𝔪𝔦𝔰 is a collaborative “filesystem” for [IPFS](//ipfs.io) resources. It varies from a traditional directory tree in the following ways:

## Features

### **Context Forest:**

In a regular filesystem, each file exists at a single point in the tree. 

In 𝔐𝔦̈𝔪𝔦𝔰 *every* reasonable path for a resource resolves.

### **Pathsets:**

When searching through resources, rather than a single path, the user can specify combinations of paths, and display elements that are common between them.

### **Per-User Trees:**

Every import is into a tree rooted using the user's ENS reverse record. The import trees are then optionally transformed and conglomerated into the user's search graph.

Resolution of pathsets is done by traversing multiple users' graphs. There is a subgraph that describes how the different trees should be combined. Users can choose to traverse sequentially taking the first match, or to generate an ordered list of potential resolutions.

### **Collaborative Filter:**



### **Native Collections:**

Folders may contain multiple resources with the same name.

## Data Structures

### **`User` Nodes:**
### **`Import` Relations:**
### **`Root` Nodes:**
### **`Directory` Nodes:**
### **`Resource` Nodes:**
### **`Content` Nodes:**
