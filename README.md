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

Each user has their own tree which contains any files they've imported as well as links into other user's graphs.

### **Collaborative Filter:**

Based on the number of users linking to a given resource with a particular path strengthens the probability that the path is the best choice.

### **Native Collections:**

Folders may contain multiple resources with the same name.

### **Versioning:**

It is possible to take a snapshot of the state of a filesystem and track the progression of a system through time.

### **Contexts:**

For a given location in the context graph, there are multiple *contexts* that can be used to view it.

## Data Structures

### **`User` Nodes:**
### **`Import` Relations:**
### **`Root` Nodes:**
### **`Directory` Nodes:**
### **`Resource` Nodes:**
### **`Content` Nodes:**
