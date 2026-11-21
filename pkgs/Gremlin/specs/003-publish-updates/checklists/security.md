# Security & Trust Requirements Quality Checklist: Publish Write-Layer Updates

**Purpose**: Test whether the requirements for attribution, tampering, untrusted input, and public exposure are complete, clear, consistent, and measurable, before implementation.

**Created**: 2026-11-21

**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md) · [contracts/documents.md](../contracts/documents.md)

**Depth**: Standard · **Audience**: Reviewer of the spec & plan, before `/speckit-implement` · **Focus**: Trust boundaries and the threat model; attribution and signatures; untrusted received Updates; public exposure and privacy; local-graph integrity

**Related**: [publishing.md](publishing.md) already covers what the wallet shows when signing (CHK010), contract wallets (CHK044), telling users that publishing is public (CHK011), and session expiry mid-publish (CHK034). Those aren't repeated here.

## Requirement Completeness

- [ ] CHK001 Does the spec state a threat model, saying who is trusted and who isn't: the signing account, the storing device, the storage node, other users, and whoever supplies a received Update's address? [Gap, Constitution I]
- [ ] CHK002 Are requirements defined for which local-only data must never appear in a published document, such as graph vertex ids, the session token, or local timestamps? [Gap, Constitution I, Spec §FR-005]
- [ ] CHK003 Is it required that a signed-in user can stage and publish only Spots in their own tree, and never another user's Spots reached through a mount? [Completeness, Spec §FR-001, §FR-002]
- [ ] CHK004 Are requirements defined to stop a client from changing, between preparing and committing, what a publish marks as published or records as the device's latest? [Gap, Spec §FR-012, §FR-014]
- [ ] CHK005 Is it required that a block fetched for a received Update is checked against its address before it's trusted, rather than taking the storage node's word for it? [Gap, Spec §FR-024]
- [ ] CHK006 Are limits specified for received Updates, covering block size, the length of unsigned fields such as `comment`, and fetch time, so that a hostile Update can't exhaust the server? [Gap, Spec §FR-024, §FR-032]
- [ ] CHK007 Are requirements defined for who may record a received Update into the shared local graph, and how often? Today any signed-in user can make the server fetch any address. [Gap, Spec §FR-024]
- [ ] CHK008 Is it required that every field of a received Update shown in the app (device, sequence, comment, author) is treated as untrusted text and never interpreted as markup? The log dialog renders messages as raw HTML (`{@html log}`). [Gap, Spec §FR-029]
- [ ] CHK009 Are observability requirements defined for security-relevant events, such as refused signatures, rejected malformed Updates, and equivocating devices, so they can be audited later? [Gap]

## Requirement Clarity

- [ ] CHK010 Is “derive the Ethereum account that signed it” precise about what's signed, so that a signature made for another purpose or app can't be taken for an Update's? That is, is domain separation required? [Clarity, Spec §FR-006, §FR-020]
- [ ] CHK011 Is it clear whether a mount's `creator` is a claim made by the mounting author, inside their own signed version, rather than an attestation by the creator, and how readers should weigh it? [Ambiguity, Spec §FR-008, Constitution I]
- [ ] CHK012 Is “malformed signature” defined well enough to separate an unrecoverable signature from a valid signature by the wrong account? [Clarity, Spec §FR-026, §US5-4]
- [ ] CHK013 Is it specified whether a received Update with fields beyond those listed in FR-005 is accepted, rejected, or stripped? [Clarity, Spec §FR-005, §FR-026]
- [ ] CHK014 Is “the wallet account signing differs from the signed-in account” clear about what happens when the session is for one account and the wallet switches accounts between preparing and signing? [Clarity, Spec §FR-007, §US4-3]

## Requirement Consistency

- [ ] CHK015 Is FR-029's “never presented as the author's” consistent with showing the publisher their own comment right after publishing, and is that exception stated? [Consistency, Spec §FR-029, §US1-3]
- [ ] CHK016 Is Constitution I's “every published change MUST be attributable” consistent with publishing a mount whose `creator` names an account that never signed it? [Consistency, Constitution I, Spec §FR-008]
- [ ] CHK017 Do FR-026's dedup rule (copies differing only in unsigned fields are one Update) and the assumption that two Updates with the same device and sequence but different signed parts are both recorded agree on how an equivocating device is surfaced? [Consistency, Spec §FR-026, Assumptions]

## Acceptance Criteria Quality

- [ ] CHK018 Is there a measurable success criterion for rejecting forged or malformed received Updates, such as “100% rejected, none recorded”, as SC-005 gives for tampering? [Gap, Spec §FR-026, §SC-005]
- [ ] CHK019 Can “refused before anything is stored” be checked objectively, with “stored” defined for the user's storage node and the local graph? [Measurability, Spec §US4-3, §FR-007]

## Scenario Coverage

- [ ] CHK020 Are requirements defined for a received Update whose author is the local user but whose device is unknown locally? That could be a real second device, or a stolen key. [Coverage, Spec §FR-024, Assumptions]
- [ ] CHK021 Are requirements defined for a received Update that claims the local device's uuid but is signed by another account? [Edge Case, Spec §FR-024, Key Entities “Device”]
- [ ] CHK022 Is the consequence of a compromised or lost signing key acknowledged, with forged Updates and no revocation, and is it explicitly deferred? [Assumption, Spec Assumptions “Delegated device keys are out of scope”]
- [ ] CHK023 Is it specified whether an equivocation (the same device and sequence with different signed parts) is shown to the user or only recorded? [Coverage, Spec Assumptions]

## Non-Functional Requirements

- [ ] CHK024 Is it stated which identifiers are public and linkable across Updates, namely the account, the device uuid, and the per-device sequence, so the privacy cost of publishing is explicit? [Gap, Constitution I]
- [ ] CHK025 Are requirements defined for how long a prepared-but-unsigned publish stays valid, and whether its unpinned blocks may be fetched by others in the meantime? [Gap, Spec §FR-014]

## Dependencies & Assumptions

- [ ] CHK026 Is the assumption that the storage node is the user's own (pinned there) validated for the threat model? A shared or remote node could withhold blocks, unpin them, or substitute different ones. [Assumption, Spec Assumptions, §FR-017]
- [ ] CHK027 Is the dependency on the browser wallet for signing, and the trust placed in the wallet to show the signed fields faithfully, documented? [Dependency, Spec Assumptions “Signing uses the wallet…”]

## Notes

- Check items off as `[x]`, and record the resolution inline: a spec edit, a clarification, or “deferred to the plan, research.md R#”.
- The plan already answers several items without the spec saying so: CHK004 (the sealed plan, R8), CHK005 (`put` checks CIDs; whether `get` does is open), CHK010 (the EIP-712 domain, R6), CHK014 (the account checked again at commit, R6), and CHK025 (a 10-minute expiry, R8). Lift them into the spec or mark them as planning decisions.
- CHK008 is the most concrete risk. Once received Updates can be recorded from the app (T054), their `device` string reaches a raw-HTML log line unless it's escaped.
