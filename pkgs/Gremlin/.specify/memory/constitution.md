<!--
Sync Impact Report
- Version: template → 1.0.0 (initial ratification)
- Principles: I. Public Collaboration · II. Succinct Code · III. Thorough Tests (NON-NEGOTIABLE) · IV. Minimal Comments
- Added sections: Technology Constraints · Development Workflow · Governance
- Removed sections: Principle 5 slot (four principles suffice)
- Templates:
  ✅ .specify/templates/tasks-template.md — tests mandatory, not optional
  ✅ .claude/skills/speckit-tasks/SKILL.md — tests mandatory, not optional
  ✅ .specify/templates/plan-template.md — Constitution Check gates filled per plan by /speckit-plan; no change
  ✅ .specify/templates/spec-template.md — already requires testable scenarios; no change
- Deferred TODOs:
  TODO(TEST_RUNNER): no test runner is installed yet; adopt Vitest + `pnpm test` before the next feature merges
-->

# Mïmis Constitution

## Core Principles

### I. Public Collaboration

Mïmis is a public file collaboration interface. All content is public and content-addressed on IPFS; every published change MUST be attributable to a signing Ethereum account. Contributions MUST add to the graph, never destroy: new versions link to prior ones via `PREVIOUS`, and others' trees are layered in through union mounts rather than copied or overwritten. Features MUST NOT store private data or assume a trusted central server.

Rationale: a shared graph is only trustworthy when anyone can read it, verify who wrote it, and recover what came before.

### II. Succinct Code

Code MUST be the smallest correct expression of its behavior. No speculative abstractions, single-use wrappers, dead code, or defensive handling of impossible states. Unexpected shapes MUST throw rather than be coerced into sentinels; sentinels are reserved for legitimate variance (e.g. an absent optional edge). Prefer an existing dependency or platform API over new code, and reuse over duplication. A change that deletes lines while preserving behavior is an improvement.

Rationale: every line is a liability to read, test, and maintain.

### III. Thorough Tests (NON-NEGOTIABLE)

Every behavior change MUST ship with tests, written first and seen to fail. Tests MUST cover the expected path, edge cases (empty paths, Unicode names, deep and cyclic mounts, version chains), and every thrown error. Graph traversals MUST be tested against a real JanusGraph inside a transaction that is rolled back; IPFS and signing logic MUST be tested against real encodings, not hand-written fixtures. Tests are exempt from Principle II's brevity where thoroughness demands it.

Rationale: succinct code with minimal comments is only safe when the tests are the specification.

### IV. Minimal Comments

Names and types MUST carry the meaning. A comment is permitted only to explain a non-obvious *why*: a workaround, an external constraint, or a surprising semantic (e.g. Gremlin `repeat()` being breadth-first). Comments restating code, commented-out code, and doc blocks on self-evident signatures MUST NOT be committed.

Rationale: comments drift from code; tests and names do not.

## Technology Constraints

- SvelteKit with Svelte 5 runes, TypeScript, pnpm, Node 24+.
- Server work runs through SvelteKit remote functions with Valibot-validated input; `command`s are reachable only from POST/PUT/DELETE, so GET handlers use raw traversals.
- Structure lives in JanusGraph via Gremlin; data lives on IPFS (Kubo, optionally Storacha); identity is Ethereum EIP-712 signing.
- Tests run under Vitest via `pnpm test` (TODO(TEST_RUNNER)).

## Development Workflow

- Features follow the Spec Kit flow: specify → plan → tasks → implement.
- `pnpm run lint`, `pnpm run check`, and `pnpm test` MUST pass before merge.
- Review rejects any change that violates a principle unless the plan's Complexity Tracking table justifies it.

## Governance

This constitution supersedes other practices. Amendments are made through `/speckit-constitution`, recorded in the Sync Impact Report, and propagated to dependent templates in the same change. Versioning is semantic: MAJOR for removing or redefining a principle, MINOR for adding a principle or materially expanding guidance, PATCH for clarifications. Every plan's Constitution Check and every review MUST verify compliance.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
