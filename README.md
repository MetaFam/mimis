# Mïmis

I cut my computing teeth on a VMS mainframe back in the day. Those systems have a single shared storage medium & each user has a “home” folder of their own to hold their files.

Mïmis is an attempt to create a similar shared file system.

Mïmis has existed as a goal for nearly a decade as of 2025. During that period, versions have existed in a variety of frameworks. There's:

* [Ecesis](pkgs/ecesis/): A Ruby-on-Rails app focused on curating collections of book award winners, beginning with the Hugo awards.
* [Hugo & Nebula Winners](pkgs/Hugo & Nebula Winners): A similar app, attempting to leverage the covers from [The Internet Speculative Fiction Database](https://isfdb.org), but Firebase-backed, and written in React.
* Forets: A more general purpose [Next.js-based adapter to Neo4j](pkgs/forets/) with a [force-graph frontend](pkgs/frontpage/) in React.
* [Svelte](pkgs/Svelte/): The same Neo4j-backed concept as Forets written in Svelte, with a more generic graph-propagation concept.
* [Gremlin](pkgs/Gremlin/): A restart in Svelte of the previous incarnation replacing Neo4j with a Tinkerpop-compatible database queried using Gremlin, with a Gnome Nautilus themed UI.

See [the Gremlin package](pkgs/Gremlin/) for more info on the latest version.

![Mïmis Header](pkgs/Gremlin/static/header.svg)