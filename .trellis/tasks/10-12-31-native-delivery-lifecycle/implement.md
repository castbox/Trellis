# Implementation and verification plan

Status: Planning accepted; D1 implementation and local candidate validation complete; local commit plan explicitly approved; candidate delivery and D2 pending on `codex/31-native-delivery-lifecycle`. The task is activated under the installed legacy contract; its own data has not been migrated. Scope and ACs are in `prd.md`; design is in `design.md`, with the implemented public interface in the shipped Delivery contract and versioned types. Execution/verification evidence is under `research/`.

## 1. Delivery policy and ownership

Use a staged policy with two substantive upstream Deliveries under this one Issue-scoped Task. The breaking migration has one coherent accepted scope; do not create dozens of narrow lifecycle tasks. If a later product or owner boundary genuinely becomes an independent deliverable, review that split first.

| Slice | Entry | Independent output / exit | Remaining work |
| --- | --- | --- | --- |
| D1: public contract, runnable runtime and opt-in native adoption | Reviewed plan, fresh canonical baseline and applicable implementation authorization. Existing public path remains usable. | Versioned `/task/v2` contract, deterministic TS/Python runtime, native owner entries/continuation, representative interface mapping fixtures and a usable native single/multi-Delivery sample. Provide an installable exact candidate through the separately authorized delivery process. | Current/default schema cutover, reviewed old-install migration, legacy consumer retirement, actual Guru integration and joint evidence. |
| D2: migration, default cutover and legacy retirement | D1 candidate is consumed; selected migration/compatibility inputs are current and actual custom/Guru consumer readiness is established. | Explicit migration and compatibility preflight, current `/task`/factory/native default switch, complete source/template/platform/dogfood/spec consumer retirement and relevant old-install evidence. No Task development phase remains in new normal execution. | Joint evidence if still pending; externally owned profile/template or release evidence. Code gaps produce a reviewed additional slice, never silent scope reduction. |

Final Task Completion requires all PRD ACs, D1/D2 facts, finite compatibility retirement and joint evidence bound to the same upstream/Guru candidates. Evidence-only completion may follow without another Delivery. Neither interface-candidate delivery nor both upstream merges automatically complete the Task or close #31. Software publishing, source Issue disposition, archive and resource cleanup remain separate owners/actions.

Trellis #31 owns Core/CLI/Python schema/runtime, native owners and platform entry/context adoption, upstream migration and public compatibility checks. Guru #531 owns Guru author/gates/projections/private transactions/history migration/installed scenarios. #292 and #530 are refreshed and consumed through that owner. Original business owners retain #149/#444/#155 actual workspace recovery and provider implementation. Marketplace/docs-site maintainers own their repositories/gitlinks; the release owner retains the full release matrix.

## 2. Ordered implementation checklist

### P0 — Fresh baseline and public contract gate

- [x] Re-read live Trellis #31 and comments, Guru #531/#292/#530 and the five canonical Guru sources plus current public interfaces. Record actual candidate/API identities; compare new source commitments with design Section 1. See `research/execution.md`.
- [x] Inspect Git status, current task/session, attached worktrees and repository topology; preserve unrelated files and the #23 task. Implementation uses local branch `codex/31-native-delivery-lifecycle`; no new worktree or unrelated migration.
- [x] Read package specs and `trellis-before-dev` context. Implementation/check uses Trellis subagents per current workflow after activation; each dispatch begins `Active task: .trellis/tasks/10-12-31-native-delivery-lifecycle` and respects native context injection/child-side loading. The validated manifests reference large `platform-integration.md`, `script-conventions.md` and `quality-guidelines.md`; automatic injection can truncate them and hit the total payload cap. Each child must explicitly read the complete matching sections from the canonical files, and read any deferred artifact/index entry from disk. Do not enlarge global injection settings or treat truncated injection as complete guideline loading.
- [x] Promote reviewed design contracts into one upstream-owned durable public document and versioned schema/API definitions, including Task/Delivery/candidate/result identity, legal transitions, owner roles, query union, native profile conditions, result recovery and migration errors.
- [ ] Validate actual Guru producer -> proposed input -> output -> consumer fixtures with the observed public schemas. D1 shared mapping fixtures pass in both runtimes; actual Guru owner review/consumption remains pending before D2 runtime cutover. A fixture is interface proof only. Do not message another chat or mutate Guru merely as a planning side effect.
- [x] Verify finite compatibility and package/API-version declarations against the actual source/installed candidates. Decide the actual candidate package version with the release/implementation owner without publishing it.

Exit: contract is reviewable, backward incompatibility is explicit, and no unknown owner or unmapped required result blocks D1 design. Scope/design changes return to the relevant plan owner; do not use an old generic confirmation for a changed plan.

### P1 — D1 domain/storage/runtime

- [x] Implement schema-2 Task aggregate and Delivery API 1.0 behind explicit versioned entry `/task/v2`. Keep old writable authority only for un-migrated records during the compatibility window; no dual writes.
- [x] Implement canonical Core schema/read/write/factory exports and closed transition/result APIs. Ordinary store writes validate existing bytes, shape, immutable identities and contained paths; use atomic-write conventions. Do not export arbitrary set-phase.
- [x] Implement Python equivalents in new/affected common modules and `delivery.py`; wire template collection, package copy and owned dogfood runtime. Both implementations use the same data/transition/error fixture corpus.
- [x] Add Task authority and per-Delivery artifact resolution, scoped candidate refs, minimal formal result storage/recovery and history-only outcomes. Verify result writes do not recursively change candidate identity.
- [x] Upgrade exact session projection to schema 3 for v2 installations, preserving TaskKey and explicit nullable Delivery selection. Keep registered-worktree/source/generation/path and identity-reservation contracts. Readers never infer or repair selections.
- [x] Implement completion/closure/reopen record APIs and explicit stop/binding release. Archival execution accepts actual current completion/closeout results and never creates them; child progress never treats missing data as done.

Exit: Core and Python agree on valid/invalid records, legal edges and recovery. D1 runtime is callable independently of Guru and all new files ship in the package.

### P2 — D1 native owners and real entry adoption

- [x] Introduce the single active-workflow runtime-contract declaration and preserve one continuation block. Markdown owners judge scope, applicability, plan acceptance, full review/readiness, delivery conditions and Completion; runtime only validates/records.
- [x] Update native workflow and common start/continue/planning/check/finish entry templates. Task create has no implicit D1; the explicit workflow creates D1 before Planning. Task start selects only; Planning acceptance moves Delivery into execution.
- [x] Add native full-review/readiness, deliver and complete-task entries with real direct consumers. Separate quality-only Check, formal Check and independent read-only full Review profiles in agents/preludes/entry routing. Do not implement competing Guru gate logic.
- [x] Implement native local_commit and manual/Git-free paths, and the bounded PR-based path with profile-specific actual postconditions. Required commit and actual already-committed candidate are distinct; no dummy commit to advance phase.
- [x] Preserve independent manual/task-free boundaries and real no_current_task/no_current_delivery/error distinctions. Direct/auto-discovered skills defer to the active workflow's owner, including native Skills in a custom/Guru workflow.
- [x] Adapt bootstrap and existing-project/joiner entry: create or select appropriate Task/Delivery without manufacturing Planning/Check/Review success. Keep bootstrap-onboarding meaning and project-local guideline authority.
- [x] Run a real native single Delivery plus a same-Task D1/D2 local/manual sample. Record actual owner results, plan paths, candidate facts and whole-task acceptance separately from test assertions.
- [x] Package D1 candidate and verify installability in a controlled checkout. Any push/PR/release/merge needed for candidate delivery is separately displayed and authorized; test artifacts are not permission.

Exit: D1 is an independent usable upstream interface/runtime/native candidate, with actual non-Guru execution evidence. Report old-default compatibility and remaining migration/Guru boundaries accurately.

### P3 — D2 explicit migration and install preflight

- [ ] Extend migrate with explicit plan 2.0; preserve 1.0's original semantics during the finite window. Cover schema/API declarations, whole reviewed Task/Delivery projection, exact raw preimages, owned session/workflow/template changes and active/archive disposition.
- [ ] Inventory old active/archived records and exact session/branch/worktree/commit/PR facts in controlled fixtures/copies. Do not assign every old outcome to D1 or derive pass from status. Original owner resolves missing semantic facts.
- [ ] Make init/update/workflow-switch/migrate preflights diagnose incompatible API/workflow combinations before writes. Existing custom content remains preserved; a `.new` sidecar is never active runtime input. Guru apply/upgrade preflight is #531-owned and must consume the same declared contract.
- [ ] Add explicit historical archive and deferred-record handling without changing identity reservations or allowing old records as new lifecycle candidates. Reopen requires reviewed migration/current authority and preserves history.
- [ ] Verify preview zero writes; raw-byte/mode preservation, stale preflight, exact same-plan resume, ordinary failure recovery and caller-owned rollback. Use exact backup/write sets; no reset, resource deletion or private Guru parsing.
- [ ] Request/consume the actual matching Guru candidate compatibility result before the destructive legacy retirement point; do not wait for #531 CLOSED and do not pretend a schema fixture is installed proof.

Exit: selected old installation can be migrated with reviewable preconditions and restored before new business writes; unsupported marketplace combinations fail before replacement. New projects remain usable independently.

### P4 — D2 all normal consumers and retirement

- [ ] Switch current Core `/task` type/factory/schema/exports to v2 and retire inferTaskPhase/TaskPhase/status defaults, field ordering and normal writer dependencies. Retain old recognition only at explicit historical/migration boundaries with documented endpoint.
- [ ] Migrate task.py create/current/list/queue/tree/archive/start/finish, all task JSON readers/writers and bootstrap factories. Commit/pr_url/completedAt have explicit historical dispositions; no hidden one-Delivery assumption remains.
- [ ] Migrate shared Python hooks, Codex/Copilot SessionStart, OpenCode JS ephemeral injections, Pi/OMP extension prompts, Snow hooks, pull preludes, statusline/other actual consumers and context artifacts. Use registry-driven coverage for all declared platform entry paths. Keep inline execution hints out of persisted phase.
- [ ] Update common Skills, generated agents/runtime agents, bundled meta references and owned dogfood copies. Inventory template and generated runtime differences rather than patch a subset.
- [ ] Coordinate external marketplace/native/TDD/channel workflow compatibility under their owner boundaries. Do not modify/advance submodules or claim their compatibility without actual corresponding evidence.
- [ ] Update durable specs before final full-scope Check; converge the public contract and migration/deprecation notes. Run all affected-package checks, regression tests and template parity tests.
- [ ] If self-hosting this task under the new runtime, first display its exact reviewed old-record/artifact/session projection, back it up and obtain the required migration authority. Never bulk-migrate unrelated repository tasks or change the active task early merely to make tests pass.

Exit: new normal runtime no longer writes/reads Task development status; all declared entry paths use the same Delivery projection and active-workflow ownership. Legacy retirement conditions from design Section 8 are satisfied or the cutover remains pending.

### P5 — Joint evidence and whole-task finish

- [ ] Consume joint evidence from Guru #531 pinned to the exact upstream API/candidate and Guru candidate; retain native D1/D2 evidence under the same identities. Original-source business-session recovery remains unclaimed without original-worktree proof.
- [ ] Verify all ACs with actual owner/location/evidence layer and uncertainty. Required external evidence missing means pending/blocking for that AC, not PASS.
- [ ] Run final full-scope Check and exact committed full Review for any additional code changes. Evidence-only arrival does not require a new Delivery/commit.
- [ ] Invoke the current workflow's actual whole-task Completion owner. Source disposition, archive/bookkeeping and cleanup follow their own later contracts/authorization; do not close #31 from a delivery PR keyword.

## 3. Verification matrix

| Scenario / AC | Upstream evidence owner / method | External owner or limits |
| --- | --- | --- |
| Identity/schema parity and fixed transitions, AC1/AC8 | Core schema/operation unit tests and shipped-Python integration using one valid/invalid fixture corpus; repeated same-result and mismatched-result assertions. | No gate sufficiency is inferred by fixtures. |
| Native single/multi Delivery, AC1/AC2 | Controlled native installation executes real local/manual outcomes, D1/D2 plan paths, explicit selection, formal gates and Completion. Record actual Git/file/result facts. | Guru installed sample is separately #531-owned. |
| Rework, scope revision and stopped slice, AC3 | Same D1 ID preserved; owner-specific return; stopped outcome and cleared execution selection; revised-scope Completion includes unrelated work. | Guru owner alone validates its private author/approval chain. |
| Clean/dirty candidate, AC4 | Real local Git repo with base integration and clean committed candidate; fresh Check/full Review without new commit, plus dirty exact-commit path. | #531 consumes actual #530 delivery and owns old #444-shaped installed regression. |
| Output loss/applicability, AC5 | Suppress original output/reject public projection after a known actual local result; producer recovers same result. Stub remote API only in upstream objective integration tests to assert mutation counts. | Guru #531 proves actual installed Publish/Merge transaction and lost-output behavior. PR/native real remote sample only under applicable authorization; stub assertions are not remote proof. |
| No-Delivery / wrong binding / local dependency, AC6 | Real registered sibling worktrees and non-Git repo; stale/ambiguous/old schema selection errors; Completion-only and closeout ingress without empty Delivery. | #531 owns #149/#155 business-shaped semantic cases and task-free caller routes. |
| Completion vs archive/cleanup, AC7/AC8 | AI-owner native acceptance sample plus executor tests refusing archive without matching result, preserving success after cleanup failure and generation reopen history. | Guru causal Completion/Closure/Finish/Cleanup stays its owner. |
| Migration, AC9 | Old active+archive+session+multi-PR-shaped public facts; dry-run snapshot, stale bytes, same-plan resume, modes and exact rollback. Include current/deferred/invalid selected records and partial/missing artifacts. | Guru private migration and original business worktrees are outside upstream execution. |
| Native/custom profile dispatch, AC10 | Actual native local/manual/Git-free sample; generated direct Skill ingress against custom owner declaration; quality Check no phase mutation; current API mismatch fails closed. | Representative Guru installed gate routing owned by #531. |
| Platform/init/update/reapply, AC11 | Registry-generated source/template/argv/envelope contract coverage; executable shared Python + OpenCode JS + Pi/OMP/pull/Snow representative carriers as applicable; controlled packaged init/migrate/reapply for native and custom workflow. | Missing external host/session is UNVERIFIED, not PASS. Full multi-host release matrix remains release-owner work. |
| Joint continuity, AC12 | Upstream evidence manifest/notes bind candidate SHA, package/API/schema, native sample and referenced Guru result locators to the same pair. | #531 supplies installed evidence and sole #149/#444/#155 verification; release owner supplies release matrix separately. |

Every acceptance evidence entry records owner, candidate/API identity, scenario, actual observation layer (code/test, static, installed, external), result, evidence locator and any unverified boundary. Use the existing task evidence/artifacts, not a new product ledger or tracked authorization/gate report. Native and Guru evidence are referenced and reused rather than rerunning each other's suites.

## 4. Concrete check commands

These existing commands are the required package/build baseline once code is implemented:

```sh
pnpm --filter @mindfoldhq/trellis-core lint
pnpm --filter @mindfoldhq/trellis-core typecheck
pnpm --filter @mindfoldhq/trellis-core test
pnpm --filter @mindfoldhq/trellis lint
pnpm --filter @mindfoldhq/trellis lint:py
pnpm typecheck
pnpm build
pnpm test
```

Targeted tests initially live beside `packages/core/test/task/` and CLI `test/scripts/`, `test/templates/`, `test/configurators/`, `test/commands/{init,migrate,workflow,update}*` and relevant regression files. Add new meaningful cases there; do not create tests that merely mirror field assignments or constants. Root full-suite results must be reported independently of targeted results. CI Python 3.9 compile/type checks remain required; an unavailable interpreter/dependency is unverified, not passing.

Existing planning/context structural checks:

```sh
python3 .trellis/scripts/task.py validate .trellis/tasks/10-12-31-native-delivery-lifecycle
python3 .trellis/scripts/task.py current --source
python3 .trellis/scripts/get_context.py --mode continuation
```

After implementation, execute the proposed `delivery.py`/v2 operations from design Section 3 in a controlled installed project, not just import-level tests. Pin the actual built/packed package and install context in the evidence. Checks during an implementation-authorized session must report actual observations; planning alone never claims future behavior was verified.

For retirement auditing, use focused `rg` queries for inferTaskPhase, Task phase exports, Task status access/default/writes, commit/pr_url/completedAt and root-only artifact loading across canonical code, templates, platform carriers and specs. Classify every remaining hit: explicit predecessor migration, historical-only reader, an unrelated process/HTTP status, or a defect. A zero broad `status` search is neither expected nor evidence of success.

## 5. Risk points and rollback

| Point | Risk / gate | Rollback or stop |
| --- | --- | --- |
| New schema/API entry | Core/Python drift or incomplete public exports | Keep existing version pinned; fix fixtures and packaging before candidate use. |
| Formal native ownership | Quality Check or automatic Skill discovery changes phase / bypasses custom owner | Stop affected formal ingress; repair active-workflow delegation before install activation. |
| Candidate freshness | Result recording creates artificial content drift; base integration loses full-review requirement | Fix content projection and producer applicability; retain actual commits/outcomes; no dummy commit. |
| Install cutover | New readers with old writer/workflow/extension | Preflight all declared schema/API/profile inputs; block before writes. |
| Migration execute | Stale raw bytes, wrong Delivery attribution or custom file loss | No preflight writes; caller reviews projection. Same-plan failure recovery accepts only exact old/target bytes; restore backed-up exact paths before new business work. |
| Archive/reopen | Archive forges completion or prior generation masquerades as current | Require actual bound completion/source disposition; preserve historical bytes/refs and stop on ambiguity. |
| Cross-repository integration | Parallel #292/#530 evolution or privately unmapped old cycles | Refresh actual owner interfaces through #531; revise thin mapping only; do not patch Guru here. |
| Self-hosting/submodules | Broad task migration or unrelated repo/gitlink changes | Inventory exact targets and stop outside owned boundaries; no reset, cleanup or unapproved mutation. |

## 6. Documentation and review status

Docs strategy: update upstream public contract and affected executable specs before final code Check; task-local plan remains the implementation design source until reviewed changes are promoted. No second Guru contract copy. Include API migration notes, supported/unsupported combinations, finite old-contract exit and evidence ownership in durable upstream docs. External docs-site/marketplace changes are handed to their owner or explicitly scoped before editing.

Planning readiness requires: requirement convergence; all source design commitments mapped; concrete types/closed APIs/phases/native owner conditions; two-repository examples; explicit version/migration/rollback; scenario AC/owner coverage; valid spec/research manifests; and a final artifact presentation. Implementation begins only after reviewed plan acceptance and task activation under the current workflow. Planning authorization alone does not authorize that activation.
