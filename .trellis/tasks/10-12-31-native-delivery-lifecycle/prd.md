# Native Delivery lifecycle and Task phase migration

## Goal

Make Delivery the native unit of planning, implementation, checking, full review and delivery. Keep Task responsible for stable identity, its overall accepted scope and whole-task acceptance. A user can finish D1, revise plans or validate existing work, deliver D2 and close the whole Task without confusing a commit, a gate pass, a merge or an archive with completion.

## Source and background

Direct Source: [castbox/Trellis#31](https://github.com/castbox/Trellis/issues/31), `exact_source`. [Guru #531](https://github.com/castbox/guru-trellis/issues/531) owns paired semantic workflow and installed integration. Current code and the required Guru startup sources were read; baseline identities and precise code anchors are in `research/current-contracts.md` and `research/source-anchors.md`. Refresh them before execution.

The current Task schema requires `status`, `inferTaskPhase` derives phase from it, `task.py start` activates execution and `archive` writes completion. Task-level commit/PR fields and planning artifacts cannot describe independent repeated Deliveries. Guru already owns slice readiness, private publication/merge recovery and overall Completion; these capabilities must be consumed and generalized within their ownership boundaries.

## Requirements

| ID | Required observable behavior |
| --- | --- |
| R1 | Task retains stable identity, Direct Source, lifecycle generation, overall accepted scope and acceptance. Delivery has its own stable identity, Task/generation relation, slice scope and planning artifacts before its first Planning call. Commit, plan revision, PR update and base integration do not change Delivery identity; the successor has a different identity. |
| R2 | D1 and subsequent Deliveries use one closed public lifecycle with real Planning, Implementation, Check, complete Review and applicable Publication/delivery owners. Native operation works without Guru. Workflow-specific internal gates and transactions do not create competing public states. |
| R3 | Task selection/session binding does not start implementation. Exact current Delivery resolution is read-only, cross-worktree safe and supports legal absence during Task scope work, Completion, Closure, archive or cleanup. A reader/continue/hook never creates a Delivery, selects a replacement from inventory or records another owner's success. |
| R4 | Candidate content, commits and evidence applicability are separate from phase. Check passed is not Review/readiness/publication/Completion. Quality-only checks do not alter formal Delivery phase. Native Skills discovered in a marketplace workflow route to that workflow's declared owner rather than running a competing gate. |
| R5 | Scope/solution changes and findings return the same undelivered Delivery to the earliest affected owner. Equivalent or unrelated changes preserve applicable results. A clean committed candidate can undergo fresh Check and first full Review without an empty, duplicate or evidence-only commit. Lost outputs return to the original producer; successful remote mutations are recovered without repeating them. |
| R6 | Whole withdrawal/replacement of an undelivered slice has an explicit non-delivered exit that preserves identity and existing commit/PR facts and releases execution binding. Partial revision remains same-Delivery rework. Completion judges current scope rather than treating stopped scope as delivered or perpetually owed. |
| R7 | An AI workflow owner independently judges whole accepted scope, including unallocated work, all applicable historical Deliveries and required evidence. Missing evidence can be refreshed without a new Delivery. Completion, source disposition, archive and cleanup remain distinct; archive cannot manufacture completion and cleanup failure does not revoke it. |
| R8 | Formal reopen preserves Task identity and historical delivery/completion facts while starting a new generation against current authority. Old gates, closure and cleanup results do not prove the new generation; applicable historical outcomes may still satisfy scope after fresh Completion judgment. |
| R9 | Explicit versioned migration replaces status-based schema/API/CLI/Python/session/hooks/context/bootstrap/list/queue/tree/inline consumers and one-Task-one-commit/PR assumptions. Active and archived data, sources, relationships and resources are retained or receive explicit reviewed disposition. Missing information produces an owner recovery or concrete diagnostic, never fabricated success or silent load-time rewriting. |
| R10 | Native local-commit, manual/no-PR and Git-free supported paths have explicit completion conditions. Guru retains its PR-based policy, Refs-only Chinese payload, expected-head merge/trailers, actual CI obligations, private transaction recovery and history discovery. Manual Git/GitHub and task-free operations do not become formal gate results or require synthetic Task/Delivery creation. |
| R11 | Trellis owns one versioned public identity/current-query/transition/result/migration contract. Guru producers and consumers have concrete mappings to it. Unsupported workflow/API/install combinations are rejected before upgrade/apply writes; a temporary compatibility window has a measurable retirement condition and never double-writes authority. |
| R12 | All declared platform entry and context contracts, fresh installs, update/reapply, native and custom workflows receive relevant actual validation. Upstream capability, native behavior, Guru installed integration, joint evidence and software release are reported separately with their owners. |

## Acceptance criteria

| ID | Scenario and observable pass condition | Requirements |
| --- | --- | --- |
| AC1 | A fresh non-Guru project creates a Task, then D1 before Planning, and completes a single Delivery through the applicable native owners. No Task development phase drives the new runtime. TS, Python and injected context agree on identity and public phase. | R1-R4, R9 |
| AC2 | One Task completes two real, independent Deliveries with distinct identities and preserved D1 planning. D2 uses the same entry/return chain as D1; its scope does not overwrite the Task authority or D1 history. Both native and paired Guru samples identify their actual completion profile and facts. | R1-R2, R10-R12 |
| AC3 | D1 solution revision and partial slice revision return to D1 Planning as needed; overall scope revision first updates the proper requirement authority. Whole slice withdrawal stops D1 without pretending it was delivered; Completion can assess the revised scope. | R5-R7 |
| AC4 | A committed clean candidate after normal base integration passes a fresh Check and reaches its first full Review without another commit. A dirty increment still follows exact commit ownership. Review findings return to the correct owner, preserving unaffected planning and Git facts. | R4-R5 |
| AC5 | Lost Check/Review output returns to the producer or its legitimate result recovery. Publish/merge success followed by lost stdout or failed public projection reuses the same Delivery/candidate/result and performs zero repeated remote mutations. Concurrently changed authority still requires affected current gates; recording historical success never creates approval. | R4-R5, R11 |
| AC6 | No current Delivery correctly routes scope work, first/next Delivery planning, Completion evidence refresh, reopen validation or closeout through AI workflow ownership. Invalid/stale binding remains a concrete error. Partial missing dependencies do not prevent unrelated accepted work. | R3, R7-R8 |
| AC7 | All known Deliveries delivered still leaves Task incomplete when scope/evidence is missing. Completion can pass with no new Delivery after evidence arrives. Closure, archive and cleanup have separate results; failed cleanup preserves the completion fact. | R7 |
| AC8 | Reopen retains prior-generation historical facts; old pass/closeout results cannot authorize new-generation execution or Completion. Fresh Completion may use still-applicable historical outcomes. | R8 |
| AC9 | Reviewed old active/archived tasks, sessions and existing commits/PRs migrate or are preserved with a concrete history-only/owner-recovery disposition. Dry-run writes nothing; stale source bytes cause no preflight writes; same-plan resume preserves user changes; rollback restores only the reviewed write set. | R9, R11 |
| AC10 | Native local/no-PR, Git-free/manual and PR-based profiles run their actual owners. Neither profile manufactures GitHub facts or imposes Guru policy globally. Native skill auto-discovery in a representative custom/Guru workflow executes the current workflow's owner, including quality-only Check and task-free/manual boundaries. | R2-R4, R10-R11 |
| AC11 | Registry-derived coverage confirms every declared platform entry's schema, continuation and context semantics; representative hook, JS and extension/pull paths have installed or executable evidence. Fresh install and old-install migrate/update/reapply handle native/user-managed workflow content without losing customization. Unavailable external hosts are explicitly unverified. | R9-R12 |
| AC12 | A joint record names the exact same upstream candidate/API and Guru candidate across the native and installed Guru samples. Guru #531 alone owns #149/#444/#155 semantic installed regressions and private history migration; upstream references their results. No original business session is called recovered without its own worktree evidence. | R11-R12 |

## Scope boundaries

In scope: public Task/Delivery schema and APIs; deterministic storage/transitions; native workflow/Skill ownership; current session and candidate applicability; explicit core migration; platform/template/spec alignment; representative marketplace interface compatibility and evidence consumption.

Out of scope: Guru implementation/gate rewriting in this repository; business code or original business-worktree migration/recovery; deployment/production writes; Issue closure as an automatic effect; publishing a software release; unrequested resource cleanup; arbitrary workflow engines, audit ledgers/event sourcing, persistent authorization, distributed transactions, lock/attack/stress/crash-hardening expansion. The complete release matrix stays with its designated release owner.

## Risks and evidence boundaries

This is a public breaking migration across two languages and multiple platform carriers. #292 and #530 are still open at the evidence read; their actual delivered contracts may change integration details. The interface candidate can be delivered before Guru #531 closes, but cannot claim paired compatibility until joint evidence arrives. Unknown/unindexed SDK consumers need a published migration contract and version diagnosis, not an assumption of absence.

Planning was reviewed and D1 implementation authorized. Technical schema, storage, phases, owner mappings, version boundaries and rollback decisions are in `design.md`; ordered execution, validation ownership and readiness gates are in `implement.md`. Actual D1 implementation/installed evidence is recorded in `research/execution.md`. D2 and whole-Issue acceptance remain pending their declared consumer/migration/joint-evidence boundaries.
