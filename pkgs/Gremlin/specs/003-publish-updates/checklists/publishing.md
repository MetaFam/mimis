# Publishing Requirements Quality Checklist: Publish Write-Layer Updates

**Purpose**: Test whether the requirements for versioning, selection, signing, recording, and failure handling are complete, clear, consistent, and measurable, before `/speckit-tasks` turns them into work.

**Created**: 2026-11-20

**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [data-model.md](../data-model.md) · [contracts/documents.md](../contracts/documents.md)

**Depth**: Standard · **Audience**: Reviewer of the spec & plan, before tasks · **Focus**: Version & entry semantics; selection & connection; signing & recording; concurrency, failure & recovery

## Requirement Completeness

- [x] CHK001 Does the spec say how an entry that was edited in place since it was published, such as a renamed `contains` link or a reordered mount, is represented: as a replacement entry with the same key, or as a tombstone plus an addition? [Gap, Spec §FR-008] — Resolved 2026-11-21: listed again with the same key, replacing the earlier entry (FR-008).
- [x] CHK002 Does the spec say whether replacing a file's bytes keeps its Content's uuid, giving a new Content version, or creates a new Content? SC-004 depends on the answer. [Gap, Spec §FR-009, §SC-004] — Resolved 2026-11-20: it keeps the Content (FR-031).
- [x] CHK003 Does the spec say what a Spot `contents` entry's `type` means when its Content holds several representations of different types, as in US3-2? [Gap, Spec §FR-008, §US3-2] — Resolved 2026-11-20: separate types are separate Contents (Clarifications, FR-031), and US3-2 is rewritten.
- [ ] CHK004 Does the spec say whether `order` belongs to the Spot holding a Content, so it can differ per holding Spot, or to the Content itself? [Gap, Spec §FR-008, Edge Cases “Order matters”]
- [x] CHK005 Are requirements for removing a Spot entirely (removing its last `contains` link) defined, including what becomes of its published versions? [Gap, Spec §US3] — Resolved 2026-11-21: removing a Spot entirely is out of scope, deferred to a later feature (Assumptions).
- [x] CHK006 Does any requirement cover how the user removes a representation or a mount, which US3-2 and US3-3 assume they can? Or is that marked out of scope? [Gap, Dependency, Spec §US3-2, §US3-3] — Resolved 2026-11-21: no new editing actions in this feature; US3 is tested below the UI (Clarifications, Assumptions).
- [ ] CHK007 Are Content moves between Spots covered by the move requirements, or only Spot moves? [Gap, Spec §FR-004, §US3-1]
- [ ] CHK008 Are the shape and validity rules for a received Update fully listed: field types, a positive sequence, `previous` present exactly when sequence > 1, and whether unknown extra fields are allowed? [Gap, Spec §FR-026]
- [ ] CHK009 Does the spec say whether a received Update's `previous` must be checked, for example that it names the same device's sequence − 1, before it is recorded? [Gap, Spec §FR-024, §US5-3]
- [ ] CHK010 Is there a requirement for what the user sees in the wallet when signing, such as human-readable fields rather than an opaque hash? [Gap, Spec §US1, §FR-006]
- [ ] CHK011 Does the spec tell users that everything published, including the comment, is permanently public? [Gap, Constitution I, Spec §FR-005]

## Requirement Clarity

- [ ] CHK012 Is “only the entries that changed since then” defined precisely enough to say whether a child's new version counts as a change to its parent's entry? FR-011 implies it doesn't, but FR-008 doesn't say so. [Clarity, Spec §FR-008, §FR-011]
- [ ] CHK013 Is “the user's own tree”, which decides whether a mount records a `creator`, defined? In particular, does a Spot reachable only through mounts count? [Ambiguity, Spec §FR-008, Edge Cases “A mount whose target…”]
- [ ] CHK014 When a new Spot has several unpublished parents, does the spec say which one is used to connect it? [Ambiguity, Spec §FR-003, Edge Cases “A Spot reachable by more than one path”]
- [ ] CHK015 Is what makes a removal and an addition “a move” defined: the same link uuid, or the same child Spot? [Clarity, Spec §FR-004]
- [ ] CHK016 Is “stage every pending change at once” clear about Spots whose only pending changes are in their Content? [Clarity, Spec §FR-002, §FR-030]
- [ ] CHK017 Is the moment a publish “starts” defined: pressing Publish, preparation finishing, or the signature request? The staging and in-progress edge cases both depend on it. [Ambiguity, Edge Cases “Staging marks a Spot…”, Spec §FR-015]
- [ ] CHK018 Is “has all its changes undone” defined: restoring an identical state, such as moving away and back, or reverting particular operations? [Ambiguity, Edge Cases “A Spot that is staged and then…”]
- [x] CHK019 Is “removed from the write layer” defined in a way that doesn't contradict FR-013's “listings unchanged”, so it means unmarked as pending rather than deleted? [Clarity, Spec §FR-012, §FR-013] — Resolved 2026-11-21: it means marked as published and no longer pending, not deleted (FR-012).
- [ ] CHK020 Is “stored” in “refused before anything is stored” defined? Does writing unreferenced, unpinned blocks count? [Clarity, Spec §FR-007, §US4-3, §FR-014]
- [ ] CHK021 Is “publishing again is safe” after a partial failure spelled out: same sequence reused, no duplicate Update, the same blocks reproduced? [Clarity, Edge Cases “If storing the Update fails partway”]
- [ ] CHK022 Is how the root is marked, and how a later device knows not to mark another, stated or explicitly deferred to planning with a rule the plan must satisfy? [Ambiguity, Spec §FR-028, Assumptions]

## Requirement Consistency

- [x] CHK023 Do the Key Entities' descriptions of Spot version entries, with contained Spots “by name”, mounts “by order”, and Content “by order and type”, agree with the 2026-11-18 clarification that `contains` entries are keyed by the link's uuid, and with the Removal entity's keys? [Conflict, Spec §Key Entities, §Clarifications] — Resolved 2026-11-21: the Spot version entity now states each entry's key.
- [x] CHK024 Is FR-023's “the local graph keeps the current state built from published Updates” consistent with browsing a single write tree that holds both published and pending state, and with the Published graph entity? [Conflict, Spec §FR-023, §Key Entities] — Resolved 2026-11-21: one tree holds both published and pending state (FR-023).
- [ ] CHK025 Is FR-018's reconstruction from one device's latest Update consistent with the clarification that readers look a Spot up “in that Update's tree and in earlier ones” when a user has several devices whose chains don't link? [Consistency, Spec §FR-018, §Clarifications]
- [ ] CHK026 Are FR-021 (index entries only where an Update meets the published graph) and FR-028 (the root's first version has an entry) stated so a reader never meets a case neither covers, such as a partial connector version of a published Spot? [Consistency, Spec §FR-021, §FR-028]
- [ ] CHK027 Is US2-3, where a connector Spot lists only the connecting entry, consistent with FR-030's “Staging a Spot MUST stage all of that Spot's pending changes” when the connector is also staged? [Consistency, Spec §US2-3, §FR-030]
- [ ] CHK028 Is SC-004's “no Spot versions” consistent with the requirements for how a file change is represented? See CHK002. [Consistency, Spec §SC-004, §FR-009]

## Acceptance Criteria Quality

- [ ] CHK029 Does SC-001 define what counts as an “action”: opening the dialog, each checkbox, typing a comment? [Measurability, Spec §SC-001]
- [ ] CHK030 Is SC-002's “1,000 pending Spots and Content” clear on whether that's 1,000 in total or each, and does it name a reference environment? [Clarity, Spec §SC-002]
- [ ] CHK031 Does SC-007 say what “matches the browsed tree exactly” compares: names, types, blob CIDs, sizes, order, mounts? And is that the raw structure or the union-mount listing? [Measurability, Spec §SC-007, §FR-018]
- [ ] CHK032 Can FR-028's “no other Spot version, in any of the user's Updates from any device” be verified within this feature, given that importing other devices' Updates is out of scope? [Measurability, Spec §FR-028]
- [ ] CHK033 Are US5's acceptance scenarios measurable for “no listing changes”, and do they state which listings are compared? [Measurability, Spec §US5-1, §FR-025]

## Scenario Coverage

- [ ] CHK034 Are exception requirements defined for a session that expires, or a wallet that disconnects, between preparing and committing a publish? [Gap, Exception Flow, Spec §FR-014]
- [ ] CHK035 Does FR-016 say what the losing publish experiences: an error to retry, a queue, or a silent merge? And does serialization have to hold across server instances, not just tabs? [Gap, Spec §FR-016, Edge Cases “Two publishes…”]
- [ ] CHK036 Are recovery requirements defined for a crash after the Update is stored and pinned but before local state is updated? [Gap, Recovery, Spec §FR-012, §FR-014]
- [ ] CHK037 Is FR-026's sameness rule defined for copies with the same signed fields but a different signature, such as one from a non-deterministic signer? [Edge Case, Gap, Spec §FR-026]

## Edge Case Coverage

- [x] CHK038 Is a mount removal's key, the target Spot's uuid, unambiguous when one Spot mounts the same target twice at different orders? [Edge Case, Spec §Key Entities “Removal”] — Resolved 2026-11-21: a Spot mounts a given target at most once (FR-008, Edge Cases).
- [ ] CHK039 Do the requirements say how readers order mounts or Contents whose `order` values tie? [Edge Case, Edge Cases “Order matters”]
- [ ] CHK040 Are Unicode normalization requirements stated for names, for example whether NFC and NFD forms of “é” are one name or two? [Edge Case, Gap, Edge Cases “Names in any script…”]
- [x] CHK041 Are size limits addressed for a single version with thousands of entries, which may exceed IPFS's ~1 MiB practical block limit, such as a first publish of a wide directory? [Gap, Non-Functional, Spec §FR-017, §SC-002] — Resolved 2026-11-21: oversized versions become a chain of versions in the same Update (FR-032).

## Non-Functional Requirements

- [ ] CHK042 Are accessibility requirements, such as keyboard operation and status announcements, specified for staging and publishing? [Gap, Spec §US1, §US2]
- [ ] CHK043 Is a performance or responsiveness requirement given for listing pending and staged Spots in a large tree, separate from SC-002's publish time? [Gap, Spec §FR-002, §SC-004]

## Dependencies & Assumptions

- [ ] CHK044 Is the assumption that Updates are signed by an account whose author can be recovered from the signature stated? Contract wallets (EIP-1271) can't be. [Assumption, Spec §FR-020, Assumptions “Signing uses the wallet…”]
- [ ] CHK045 Is the assumption that the storage node is the user's own validated for deployments where several users share one node and its pins? [Assumption, Spec §FR-017, Assumptions “kept on the user's own storage node”]
- [ ] CHK046 Is the case of a reinstalled device or a reset local graph, which yields a new Device and possibly a new root, addressed or explicitly excluded? [Assumption, Gap, Spec Assumptions “The device identity…”, §FR-028]

## Notes

- Check items off as `[x]`, and record the resolution inline: a spec edit, a clarification, or “deferred to the plan, research.md R#”.
- Several items are already answered in the plan but not in the spec: CHK002 and CHK004 (research.md R11), CHK014 and CHK015 (R3), CHK020 (R6), CHK035 (R9), and CHK044 (R6). Either lift those answers into the spec or mark them as planning decisions.
- CHK023 and CHK024 are wording conflicts within the spec itself, and the cheapest to fix.
