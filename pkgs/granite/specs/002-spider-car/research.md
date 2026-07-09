# Phase 0 Research: Spider & CAR Transfer

**Date**: 2026-07-09 | **Plan**: [plan.md](./plan.md)

No `NEEDS CLARIFICATION` markers remained in the Technical Context; this records the decisions and the alternatives weighed.

## R1. File content: UnixFS via Kubo `add` (raw leaves, Rabin chunking), read-back via `cat`

- **Decision**: Each selected file is imported into Kubo with `add` using **`rawLeaves: true`** and the **Rabin chunker** (`chunker: 'rabin'`), yielding one content CID per file regardless of size. Leaf blocks are raw codec — their CIDs are hashes of the file bytes themselves, with no UnixFS envelope; a file that fits one chunk is a bare raw block. The file's graph node references the root from `data.content` (a real CID link). Reading content back is Kubo `cat` — no importer/exporter libraries in-process.
- **Rationale**: Kubo is already required and does chunking, DAG layout, and dedup natively; Rabin's content-defined chunk boundaries mean edits and insertions re-chunk only locally, so shared runs of bytes across file versions dedupe instead of shifting every subsequent fixed-size chunk; raw leaves keep leaf CIDs content-pure and shave the envelope bytes. UnixFS structure above the leaves keeps every archived file fetchable by gateways and every other IPFS tool, matching how the wider Mïmis JanusGraph model treats `File.cid`. Zero new dependencies.
- **Alternatives considered**: **`unixfs-importer` in-process** (several transitive deps to reimplement what the daemon already does); **single raw block per file** (breaks past the ~1 MiB block transfer limit); **fixed-size chunking (Kubo's default)** (an insertion shifts every following chunk boundary, destroying cross-version dedup — rejected in favor of Rabin); **custom dag-cbor chunk manifest** (zero deps but an island format no other tool can read — rejected for the same interop reason CARs were chosen at the spec level).

## R2. Archive assembly: Kubo `dag export` / `dag import`

- **Decision**: The archive is Kubo's `dag export <updateCid>` — a CARv1 whose single root is the Update document, containing every block reachable from it (update → tree nodes → UnixFS file DAGs, since `data.content` is a real CID link that dag-cbor traversal follows). `load` streams the file into `dag import`.
- **Rationale**: Completeness by construction — the export traverses exactly the update's closure, so FR-004's "everything selected, nothing else" falls out of the DAG shape. Both commands are single RPC round trips over the existing client; hash verification on import is free.
- **Alternatives considered**: **`@ipld/car` in-process CarWriter/Reader** (works offline without a daemon, but the spider already needs Kubo for UnixFS import — a daemon-less mode would be a different feature); **`ipfs-car`** (the sibling app uses it browser-side, but it duplicates what the daemon does here).

## R3. Load validation: offline walk after import

- **Decision**: After `dag import`, `load` walks from the Update document with **offline** block gets (`offline: true` on the RPC calls): validate the Update and every Node via the existing codec guards, recurse through `edges`/`mounts` CID sources, and check each `data.content` UnixFS root is locally present (`refs -r` offline). Any missing block ⇒ `UnreachableNodeError` naming the CID; any malformed document ⇒ `MalformedDocumentError` (FR-008, SC-004). On success, `putUpdate`/cache note when a Gremlin endpoint is configured.
- **Rationale**: Offline mode turns "missing from the archive" into an immediate, nameable failure instead of a DHT search hang; reuses the existing validation path so archives obey exactly the same shape rules as live content.
- **Alternatives considered**: **recursive pin as the completeness check** (fails on missing blocks but with poorer error attribution and an unwanted pin side effect on invalid archives); **trusting the CAR** (rejected: FR-008/SC-004 demand named rejection).

## R4. Ignore semantics: the `ignore` package

- **Decision**: Hidden entries (dot-prefixed) and entries matched by `.gitignore`-style files in the walked tree are deselected by default but listed in the UI (FR-003). Both this and US3's include/exclude patterns use the `ignore` package's matcher. New runtime dependency, justified in the plan's Complexity Tracking.
- **Rationale**: gitignore semantics (negation, anchoring, directory-only rules) are subtle and users' existing `.gitignore` files must behave exactly as git makes them expect; `ignore` is tiny, dependency-free, and already the workspace idiom (sibling Gremlin app).
- **Alternatives considered**: **hand-rolled globs** (diverges from the standard in exactly the cases users rely on); **minimatch/picomatch** (glob engines, not gitignore engines — wrong semantics at the edges).

## R5. Selection UI: hand-rolled ANSI tree over `node:readline`

- **Decision**: A ~150-line terminal selector: the tree renders with checkbox glyphs, sizes, and dim styling for default-deselected entries; arrows move, space toggles (subtree toggle on directories), `h` reveals hidden/ignored, enter confirms, `q`/ctrl-c aborts. It mutates the same pure selection model that `--yes`/patterns evaluate, so scripted and interactive runs are one code path (SC-005). Confirming with an empty selection is refused (edge case).
- **Rationale**: Principle I — a TUI framework is a heavy dependency for one checkbox tree; `node:readline` keypress events plus ANSI escapes cover the need, and the pure-model split keeps the UI untested surface minimal (model unit-tested without a TTY).
- **Alternatives considered**: **ink** (React in the terminal — the antithesis of "most technologically incomplete"); **@inquirer/checkbox** (flat list, no tree, still a dep); **enquirer/prompts** (same shape problem).

## R6. Update authorship & chaining at spider time

- **Decision**: `spider` requires a publishing key (updates carry `publisher`). At generation it attempts `registry.latest(publisher)` for `prev`; if the registry is unreachable it proceeds chainless and prints a warning. The CAR is complete but *unpublished* — `load` never registers or announces (FR-010); publishing a loaded/generated update later is feature 001's existing flow.
- **Rationale**: Matches the spec's assumption verbatim; keeps load strictly local so archives are safe to inspect before any public action.
- **Alternatives considered**: **tree-only CARs with update creation at load** (breaks "a CAR containing an update" and moves authorship to the wrong machine/key); **load-also-registers** (violates FR-010 and least-surprise for imported foreign archives).
