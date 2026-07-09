# Feature Specification: Granite Core Graph

**Feature Branch**: `001-granite-graph-core`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Initial Mïmis Granite system per README: the most
technologically incomplete version of Mïmis possible while still retaining the
character — a graph database formed of union mounts of linked trees, published
as immutable, content-addressed updates that chain to their predecessors, with
per-publisher keys, live broadcast of new updates, and a durable public
registry of each publisher's latest update."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish a Graph Update (Priority: P1)

A publisher assembles a tree of nodes connected by named, property-bearing
relationships and publishes it as a single immutable update identified by one
root reference. An update is a partial snapshot — it asserts only the paths
it contains, and needn't describe the whole of the publisher's tree. Every
publish after the first links back to the publisher's previous update, so the
full history of their graph is preserved as a chain, and the publisher's
effective graph is the union of that chain, newest shadowing oldest.

**Why this priority**: Nothing else in the system exists until content can be
published and retrieved. This is the smallest slice that is recognizably
Mïmis: a linked tree, addressable by content, that can never be silently
rewritten.

**Independent Test**: On a single machine, publish a small tree and fetch it
back by its root reference; publish a second version and confirm both versions
remain retrievable and the newer one links to the older one.

**Acceptance Scenarios**:

1. **Given** a publisher with a publishing key and a tree of nodes and
   relationships, **When** they publish it, **Then** the update is retrievable
   by its root reference and each node within it is individually retrievable
   by its own reference.
2. **Given** a publisher who has published before, **When** they publish a new
   update, **Then** the new update contains a link to their most recent prior
   update, and the prior update remains retrievable, unchanged.
3. **Given** a publisher's first-ever publish, **When** the update is created,
   **Then** it carries no previous-update link, marking the start of the chain.
4. **Given** any already-published update, **When** any later publish occurs,
   **Then** the earlier update's content is bit-for-bit unchanged.

---

### User Story 2 - Read the Composed Graph (Priority: P2)

A reader takes an ordered set of updates, union-mounts them into a single
logical graph, and resolves paths through it. Where two updates define the
same path, the update mounted later shadows the earlier one; where only an
earlier update defines a path, resolution falls through to it.

**Why this priority**: Union mounting is how a pile of immutable updates
becomes a usable, current graph. Without it, readers can only see frozen
snapshots one at a time.

**Independent Test**: Mount two locally published updates where the second
redefines one path and leaves another untouched; verify the redefined path
returns the newer value and the untouched path returns the older value.

**Acceptance Scenarios**:

1. **Given** two mounted updates where the later one redefines a path,
   **When** a reader resolves that path, **Then** the later update's value is
   returned.
2. **Given** a path defined only in an earlier mounted update, **When** a
   reader resolves it, **Then** the earlier update's value is returned.
3. **Given** a path defined in no mounted update, **When** a reader resolves
   it, **Then** the reader receives a definitive "not present" result rather
   than an error.
4. **Given** the same set of updates mounted in the same order, **When** any
   path is resolved repeatedly, **Then** the result is identical every time.

---

### User Story 3 - Discover Other Publishers' Updates (Priority: P3)

A reader who knows only a publisher's identity finds that publisher's latest
update through a durable public registry, and — if listening — hears about new
updates as they are announced, without polling. From the latest update the
reader can walk the chain of previous-update links back through history.

**Why this priority**: Discovery turns Granite from a personal store into a
network. It depends on publishing (P1) and is most useful once reading (P2)
works, so it comes third.

**Acceptance Scenarios**:

1. **Given** a publisher who has published at least once, **When** a reader
   queries the registry with the publisher's identity, **Then** they receive
   the root reference of that publisher's latest update.
2. **Given** a reader subscribed to announcements, **When** a publisher
   publishes a new update, **Then** the reader learns the new root reference
   without asking for it.
3. **Given** the latest update's root reference, **When** the reader follows
   previous-update links, **Then** they can enumerate the publisher's full
   update history back to the first update.
4. **Given** an identity that has never published, **When** the registry is
   queried, **Then** the reader receives a definitive "no updates" result.

---

### User Story 4 - Conglomerate Publishers into a Directory (Priority: P4)

A user with several publishing nodes (or a reader following several
publishers) union-mounts those publishers' graphs — each rooted at its own
universal root — into one directory, presenting their combined content as a
single navigable tree.

**Why this priority**: This is the payoff of the union-mount design — multiple
sovereign publishers composing into one coherent space — but it is pure
composition of the earlier stories and delivers nothing until they exist.

**Independent Test**: Publish from two distinct keys, mount both graphs into
one directory, and resolve paths that live in each publisher's tree plus one
path both define, verifying shadow order.

**Acceptance Scenarios**:

1. **Given** updates from two different publishing keys, **When** both are
   mounted into one directory, **Then** paths unique to each publisher resolve
   to that publisher's content.
2. **Given** a path defined by both publishers, **When** it is resolved,
   **Then** the publisher mounted later wins, per the reader's chosen mount
   order.
3. **Given** a published node that declares a mount of another publisher's
   graph, **When** a reader resolves a path passing through that node,
   **Then** the mounted publisher's content appears beneath it, with the
   node's own relationships shadowing anything the mount provides.

---

### Edge Cases

- A node referenced by an edge cannot be retrieved (missing or unreachable
  document): traversal surfaces a hard failure naming the unreachable
  reference — it does not silently skip or return "not present".
- An update's previous-update link points at something unretrievable: layers
  newer than the break remain usable, but because updates are partial
  snapshots, resolution cannot distinguish "absent" from "defined below the
  break" — falling through past the break fails loudly rather than answering
  "not present".
- A retrieved document does not have the expected structure (e.g. an error
  object where a node was expected): the operation fails immediately with the
  malformed content identified, per the constitution's error-handling rule.
- Two mounted updates define the same relationship name with different
  properties: the later mount's relationship shadows the earlier one entirely
  (properties are not merged).
- A publisher republishes content identical to their previous update: this is
  a legitimate new link in the chain, not an error.
- The registry and the live announcements disagree (announcement arrived but
  registry not yet updated, or vice versa): the reader may act on whichever it
  trusts; both eventually converge on the same latest root.
- Node mounts form a cycle (A mounts B, B mounts A): resolution follows
  mounts only to the configured depth; content beyond the bound is simply not
  visible — bounded, deterministic, and not an error.
- A node mounts a publisher who has never published: the mount contributes
  nothing (absence, not an error); an unretrievable mount *target* (a node
  reference that cannot be fetched) fails loudly like any unreachable node.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Publishers MUST be able to publish a tree of nodes and
  relationships as a single immutable update identified by one root reference.
- **FR-002**: Every node MUST be independently retrievable by its own
  content-derived reference; relationships MUST carry their properties and a
  reference to the child node they point to.
- **FR-003**: Each update after a publisher's first MUST link to that
  publisher's most recently published previous update; the first update
  carries no previous link.
- **FR-004**: Published content MUST never be mutated or deleted by the
  system; every change MUST be expressed as a new update layered over history.
- **FR-005**: Every publishing node MUST have its own publishing key, and
  every update MUST be attributable to the key that published it.
- **FR-006**: All of a publisher's updates MUST be expressed relative to the
  same universal root specific to that publishing key.
- **FR-007**: The system MUST record each publisher's latest update root in a
  durable, publicly queryable registry keyed by publisher identity.
- **FR-008**: The system MUST broadcast an announcement of each new update so
  that live subscribers learn the new root without polling.
- **FR-009**: Readers MUST be able to union-mount an ordered set of updates
  into one logical graph in which later mounts shadow earlier ones and
  unshadowed paths fall through to earlier mounts.
- **FR-010**: Readers MUST be able to resolve a path through the mounted graph
  to the node it names, deterministically for a given mount order.
- **FR-011**: Readers MUST be able to walk an update's chain of previous links
  to enumerate a publisher's history.
- **FR-012**: When retrieved content has an unexpected structure, operations
  MUST fail immediately and identify the offending content; a path that is
  simply absent MUST yield a definitive "not present" result instead of a
  failure.
- **FR-013**: Updates are partial snapshots: an update asserts only the paths
  it contains. A publisher's effective graph MUST be derived by union-mounting
  their entire update chain, newest shadowing oldest, and mounting a publisher
  identity MUST mean mounting that whole chain.
- **FR-014**: A published node MAY declare mounts — references to another
  subtree (by node reference) or another publisher's graph (by identity) —
  whose content unions into that node's children during resolution. The
  node's own relationships MUST shadow mounted content; mounts MUST shadow
  each other by their declared order; mount traversal MUST be bounded by a
  configurable depth so that mount cycles terminate.
- **FR-015**: Content MUST be retrieved incrementally: a query fetches only
  the documents along the resolution paths it actually consults — as few
  nodes as possible for the search to complete. Resolving a path MUST NOT
  require retrieving an entire update or graph.

### Key Entities

- **Publisher**: An identity that owns a publishing key; the unit of
  attribution and of registry entries. One person may operate many publishers.
- **Update**: An immutable, content-addressed partial snapshot of a
  publisher's tree, asserting only the paths it contains, identified by its
  root reference and linking to the publisher's previous update (absent on
  the first).
- **Node**: A single content-addressed document in an update's tree.
- **Relationship (Edge)**: A named connection from a parent node to a child
  node, carrying its own properties and the child's reference.
- **Universal Root**: The fixed top of a publisher's tree; all of that
  publisher's updates describe content relative to it.
- **Mount Stack (Graph)**: A reader-chosen ordered set of updates composed by
  union mounting; the thing paths are resolved against.
- **Node Mount**: A mount declared *inside* a published node, unioning
  another subtree or another publisher's graph into that node's children —
  publisher-side composition, in contrast to the reader-side Mount Stack.
- **Registry Entry**: The durable public record mapping a publisher identity
  to the root reference of their latest update.
- **Announcement**: The transient broadcast message telling live subscribers a
  publisher has a new update root.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reader holding only a publisher's identity can retrieve that
  publisher's current graph without contacting any party-specific or central
  service, succeeding on the first attempt in a working network.
- **SC-002**: After any sequence of publishes, 100% of previously published
  updates remain retrievable with content identical to when they were
  published.
- **SC-003**: A subscribed reader learns of a new update within 60 seconds of
  its publication.
- **SC-004**: Path resolution over a stack of at least 10 union-mounted
  updates returns the correct shadow/fall-through result in 100% of cases, and
  identical mount orders always give identical results.
- **SC-005**: A publisher can go from a prepared tree to a globally
  announced, retrievable update with a single publish action and no manual
  follow-up steps.
- **SC-006**: A reader can enumerate a publisher's complete update history
  from the latest registry entry alone, with every historical version
  reachable.
- **SC-007**: Resolving a single path over a large graph retrieves only the
  documents on the consulted resolution paths — verifiable by fetch counting
  in tests; total fetches never scale with graph size, only with path length
  and the number of layers consulted.

## Assumptions

- The v1 audience is developers; the system is exercised through a
  programmatic interface and a minimal command-line surface rather than a
  graphical one.
- Graphs are public: no encryption, private updates, or access control in v1.
- Publishers manage their own keys; key rotation, recovery, and revocation
  are out of scope for v1.
- Updates are modest in size (up to thousands of nodes); very large graphs
  and performance tuning for them are out of scope.
- Costs of writing to the durable public registry are borne by the publisher,
  and a test network is acceptable for v1.
- When multiple publishers' content conflicts, resolution is purely the
  reader's mount order — the system imposes no cross-publisher merge policy.
- Deletion of content from the network (as opposed to shadowing it in later
  updates) is out of scope, consistent with the append-only principle.
- Because updates are partial snapshots, nothing obliges a publisher to
  republish unchanged content; older layers keep serving it through
  fall-through.
