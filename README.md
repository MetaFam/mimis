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

The file data is stored in [IPFS](//ipfs.io). The path index is stored in, currently Cloudant for speed reasons, but testing is also being done locally using PouchDB.

One of the goals is for the system to be sneakernet compatable. Ultimately, I envision two Iranians touching their phones sitting in a café. IPFS syncs in the background and Μïmis incorporates that data into a meaningful user experience.

# Goals

Eventually the app aims to be very thorough in tracking which media a user consumes and the quantities of time spent consuming.

Creators would be able to specify desired compensation rates in absolute or per time units. Consumers would not be required to pay to consume, but a tally would be kept and presented describing the costs the creators consider reasonable.

For payments, I am particularly interested in [IOTA](//iota.io). The structure is vastly more energy efficient and doesn't require external support to create transactions.

Also, tracking data could go toward creating graphs that aid in the collaborative filtering of paths.