# Μïmïs

What I want to end up with with Mïmïs is collection of all the Hugo and Nebula Award nominees. Features of the program I would like to exist are:

* A distributed proofreading system
* A mechanism for creator identification and compensation
* An interface for browsing large hierarchical collections

## Data

Μïmïs uses git repositories inserted into IPFS to track the versions of documents.

## Design Documents

The primary interface is a set of interlinked trees. The structure I want to support is Award → Year → Category → Work → Series → Author.

## Plan

I'm currently working some on [this repository](igis://dhappy/mïmis) which is currently primarily the react components for browsing a collection.

Data is loaded from IPFS in the form of CBOR-DAGs. For example, 