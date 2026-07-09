<!--
Sync Impact Report
==================
Version change: (template) → 1.0.0
Modified principles: n/a (initial ratification — all placeholders filled)
Added sections:
  - Core Principles (I–V): Radical Minimalism; Content Addressing;
    Append-Only Updates; Union-Mount Composition; Sovereign Publishing Keys
  - Technology & Style Constraints
  - Development Workflow
  - Governance
Removed sections: none (template slots consumed)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ compatible (Constitution Check gate
    reads gates from this file; no hardcoded principles to sync)
  - .specify/templates/spec-template.md ✅ compatible (no constitution refs)
  - .specify/templates/tasks-template.md ✅ compatible (no constitution refs)
  - .specify/templates/checklist-template.md ✅ compatible (no constitution refs)
Follow-up TODOs: none
-->

# Mïmis Granite Constitution

## Core Principles

### I. Radical Minimalism

Granite is the most technologically incomplete version of Mïmis possible while
still retaining the character. Every dependency, subsystem, and feature MUST be
justified against the question: "does the graph stop being Mïmis without it?"
If the answer is no, it MUST be omitted or deferred. Plans that introduce
infrastructure beyond IPFS, libp2p, and the Ethereum publication map MUST
document the violation in the plan's Complexity Tracking table before
proceeding.

**Rationale**: The project's identity is the minimal viable expression of the
Mïmis model; accretion of convenience machinery destroys the experiment.

### II. Content Addressing

All graph data MUST be stored as IPFS CBOR-DAG documents. Each node is a
separate document identified by its CID. Relationships (edges) carry their
properties inline and link to the child node by CID. Published documents are
immutable: nothing inside a published update may hold a mutable reference —
change is expressed only by publishing a new update.

**Rationale**: Content addressing makes every state of the graph verifiable,
cacheable, and host-independent; mutability anywhere inside the DAG would
break those guarantees for everything above it.

### III. Append-Only Updates

The graph history is append-only. Each update is identified by its root CID
and MUST link to the most recently published previous update from the same
publishing key, forming an unbroken chain. Updates MUST NOT rewrite, replace,
or orphan prior history; correction is a new update layered over the old.
All updates are published relative to the same universal root specific to
each publishing key.

**Rationale**: An append-only chain gives free versioning, auditability, and
conflict-free replication — the properties Mïmis exists to demonstrate.

### IV. Union-Mount Composition

A graph is a set of union-mounted updates. Reads MUST resolve through the
mount stack, with later updates shadowing earlier ones. Multiple publishing
nodes are conglomerated through union mounting to form user directories; no
component may assume a single writer or a single source of truth. Any feature
that needs "the current state" MUST derive it from the mount stack rather
than materializing a privileged merged copy.

**Rationale**: Union mounting is how independent, keyed publishers compose
into one coherent graph without coordination or a central database.

### V. Sovereign Publishing Keys

Each publishing node MUST have its own publishing key. Updates are announced
by broadcast via libp2p Gossipsub and recorded in an Ethereum map keyed by
publisher. No central server, registry, or coordinator may be required to
publish or to discover updates. Keys MUST NOT be shared between nodes;
aggregation of publishers happens only through union mounting (Principle IV).

**Rationale**: Per-node keys keep publication permissionless and make the
Ethereum map + Gossipsub the only discovery surface, preserving
decentralization.

## Technology & Style Constraints

- **Stack**: IPFS (CBOR-DAG) for storage, libp2p Gossipsub for broadcast, an
  Ethereum contract map for durable update pointers. New third-party
  dependencies require justification under Principle I.
- **Indentation & literals**: two-space indentation; array and object entries
  that sit on their own line end with a trailing comma.
- **Error handling**: when a response or document has an unexpected shape
  (e.g. `{ error }` where an array was expected), code MUST throw rather than
  return a sentinel. Sentinel returns (`null`, `[]`) are reserved for
  legitimate cardinality variance (a lookup that validly finds nothing).

## Development Workflow

- Features follow the Spec Kit flow: `/speckit-specify` → (optional
  `/speckit-clarify`) → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`, with artifacts under `specs/[###-feature]/`.
- Every plan MUST pass the Constitution Check gate against the principles
  above before Phase 0 research, and re-check after Phase 1 design.
- Violations that survive the gate MUST be recorded in the plan's Complexity
  Tracking table with the simpler alternative and why it was rejected.
- `CLAUDE.md` points agents at the current plan; the plan, not tribal
  knowledge, is the source of truth for technologies and structure.

## Governance

This constitution supersedes other practice documents for Mïmis Granite.

- **Amendments**: propose by editing this file in a commit that states the
  motivation; the version line and Sync Impact Report MUST be updated in the
  same change, and dependent templates re-checked for alignment.
- **Versioning**: semantic versioning of governance — MAJOR for removing or
  redefining a principle, MINOR for adding a principle or materially
  expanding guidance, PATCH for clarifications and wording.
- **Compliance review**: reviews of plans and implementations MUST verify
  conformance with Principles I–V; unjustified complexity is grounds for
  rejection regardless of whether the code works.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
