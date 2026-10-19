# Independent Maintenance

`trellis maintain` is an explicit maintenance boundary. It does not select the
current Task, call the old target dispatcher, create Git resources, or change
ordinary init/update, full Plan1/Plan2, current lifecycle writers or normal archive.
CLI owns installation/execution; Core `/task/maintenance` owns positive source,
projection and carrier validation. AI workflow owners supply scope/history
attribution and semantic decisions; neither API records authorization.

## Source and target

Every operation requires one existing exact project root. Supported installation
versions are stable 0.6.x and 0.7.0-castbox.N (N >= 1), no newer than the complete
executing matching CLI/Core candidate. Same-version cutover is supported. Missing,
unknown, beta/RC and newer source versions are explicit errors.

Selected Task operations take `{task_id,lifecycle_generation}` and a direct active
`.trellis/tasks/<directory>` locator. Explicit inspection and archived resume also
accept `.trellis/tasks/archive/YYYY-MM/<directory>`; ordinary conversion and
history closeout remain active-only. Known preidentity legacy and strict schema1
are predecessors; schema1 has no literal schema_version field. Schema2 is preserved
by tools installation and rejected as a fresh conversion predecessor. Unknown
records are not an empty selection. Existing identity sessions (integer 2/3),
positively matched path1 and unversioned local carriers, and canonical branch
bindings are inspected without normal lifecycle bootstrap. Inherited peer copies
establish ownership only; their Task/tool bytes are not migration targets.

## CLI and SDK

```sh
trellis maintain contract --json
trellis maintain inspect-tools --target /existing/project --json
trellis maintain inspect-task --target /existing/project --task-id task-id --generation 0 --task-ref .trellis/tasks/task-directory --json
trellis maintain prepare --input /private/input.json --json
trellis maintain preview --plan /private/plan.json --json
trellis maintain apply --plan /private/plan.json --state-dir /private/recovery --json
trellis maintain recover --recovery /private/recovery/operation-id.json --json
trellis maintain resume --recovery /private/recovery/operation-id.json --json
trellis maintain rollback --recovery /private/recovery/operation-id.json --json
```

Inspect/prepare/preview are target-write-free. Prepare prints a frozen plan; the
caller saves stdout in an external/ignored file. Recovery takes the returned exact
file reference. JSON is also the default output. Startup update notices are disabled
for this family. Runtime errors return `{error:{code,message}}` with exit code 1.

```ts
import { maintenance } from "@mindfoldhq/trellis";
const capability = maintenance.getMaintenanceContract(); // maintenance_api: "1.0"
const observed = await maintenance.inspectToolsTarget({root});
const plan = await maintenance.prepareToolsInstallation({
  root, workflow: {action: "preserve"}, file_decisions: []
});
maintenance.previewMaintenance(plan);
const result = await maintenance.applyMaintenance(plan, {state_dir});
await maintenance.recoverMaintenance({recovery_ref: result.recovery_ref!});
```

The additive namespace preserves VERSION/init and existing CLI path resolution.
Core adds only `@mindfoldhq/trellis-core/task/maintenance`; it is not a current
writer and is not reexported through legacy `/task` or Core root.

## Closed inputs

CLI prepare takes `{kind,input}`; kind is `tools_install`, `task_conversion`,
`legacy_closeout` or `task_resume`. SDK has separate typed preparation functions. Exact exported
TypeScript types and closed parsers live in
`packages/cli/src/commands/maintenance/{tools,tasks}.ts`; they are exported through
the public namespace. A raw snapshot is
`{content_base64:string,sha256:string,mode:number}` (permission bits, 0..511), or
null for absence. Hashes bind local bytes, not semantic authority.

Tools input is `{root,workflow,file_decisions}`. Workflow is `{action:"preserve"}`
or `{action:"install",template_id,provider,content,ownership:"bundled"|"custom"}`.
Each file decision is `{path,source,action:"replace"|"preserve"|"create-new"|"remove"}`.
Configured platforms come from the target. Required runtime conflicts or skip rules
block coherent installation; sidecars are not activation. Explicit bundled identity
must match the real bundle; custom remains custom even with bundled-equal bytes.
Project specs and Task/session/binding data are outside this operation.

Conversion input is `{root,key,task_ref,source_kind,projection,artifacts,
legacy_facts,sessions,branch_binding}`. source_kind is legacy/schema1. Projection
is the complete owner-authored Task2 with fixed Delivery/result IDs. Artifacts are
`{path,action:"preserve",source}` or `{path,action:"write",source,target}`; all retained
files need a disposition and planning references must resolve. Legacy facts name
commit/pr_url/completedAt, owner_id, reason `{locator,revision}`, and disposition
source_snapshot or delivery_result with result_id (completedAt is snapshot-only).
Sessions each contain `{carrier,action:"preserve"|"replace",delivery_id:string|null}`;
a carrier is `{root,path,source,kind:"session"|"branch_binding"}`. Every selected
carrier requires an explicit disposition. Branch binding is
`{action:"preserve",source}` or `{action:"establish",source:null,record}` with a closed
schema1 binding matching Task/generation and actual target branch. Absence does not
grant implicit ownership. Current gates are not inferred from old status or PR.

Historical closeout input is `{root,key,task_ref,source_kind,archive_ref,history_note,
retirements}`. For example, a Git-free project with no selected carriers can use:

```json
{
  "kind": "legacy_closeout",
  "input": {
    "root": "/existing/project",
    "key": {"task_id": "task-id", "lifecycle_generation": 0},
    "task_ref": ".trellis/tasks/task-directory",
    "source_kind": "schema1",
    "archive_ref": ".trellis/tasks/archive/2026-10/task-id",
    "history_note": "Original owner: delivery retained; external acceptance remains pending.",
    "retirements": []
  }
}
```

A readable exact raw archive (including directory/file modes and empty directories)
and note precede exact carrier retirement, which precedes active-tree removal.
A supported individual Task-directory link remains intact on conversion. Historical
closeout unlinks its logical root after archiving/removing its contents, leaving the
empty backing root outside resource-cleanup scope. Rollback restores the raw link
and original contents/modes; archive directories themselves are plain directories.
No old completion date/status is rewritten; no hooks, child mutation, Git cleanup,
commit, Issue closure or new-model Completion/Closure/Finish is implied.

## Plans, results and recovery

Prepared plans have schema_version 1.0, one kind, fixed operation_id, target_root,
common_dir, actual candidate CLI/Core versions and package digests, closed
operation-specific guard, and exact file/directory source/target actions. Task guards
also freeze the actual target branch; every replay revalidates its unique registered
owner before writes, so an ordinary intervening branch switch requires returning
to the original owner or preparing a newly reviewed operation. Plans
are private executor/recovery inputs, not lifecycle handoff or approval artifacts.

Preview and executor results are
`{operation_id,kind,status,pending_paths,recovery_ref}`. Status is prepared, pending,
applied or rolled_back; recovery_ref is null before execution and the original
operation file thereafter. Applied means the bounded writes and relevant mechanical
postconditions succeeded. It does not claim semantic continuation, acceptance or
completion. Tools apply probes the actual installed contract/context. A supported
old Task may still report maintenance_required with no current execution authority.
Conversion acceptance additionally requires the target native entry and real next
owner; historical acceptance requires normal selection no longer choosing old state.
These proofs remain distinct from executor status and business completion.

For historical closeout, each execution and result recovery freshly enumerates
the positively attributable same-Task session/branch carriers. A carrier absent
from the prepared retirement set returns `stale_source` with its path before
any write; the caller must review a fresh plan instead of silently adding it to
the write set. Already-retired original carriers do not prevent same-operation
recovery. Existing checks still protect later edits to owned paths.

The fixed original plan is saved before writes. Reapply/resume and lost-output
recovery reuse that operation and original preimages. Ordinary partial writes
accept only source/target states. Later edits to owned paths stop with
later_work_conflict; unrelated business files survive. Rollback restores only the
original write set. Old-tool restoration over Task2/session3 data is blocked as
incompatible_restore; unknown source reader compatibility stops as well. A combined
restoration needs a separate reviewed operation, never expanded backups.

Typical diagnostics include unsupported_source/version/carrier, target_key_mismatch,
ambiguous_authority, conflict, stale_source, candidate_mismatch, later_work_conflict,
incompatible_restore and restore_compatibility_unknown. Same version labels alone
do not identify builds: candidate fingerprints bind the durable bytes/modes in
`package.json`, `bin`, `src` and `dist`. Python runtime `__pycache__` directories
and `.pyc`/`.pyo` files are excluded: a normal import may create them after
preparation without changing the candidate. Real source/build byte or permission
changes still return `candidate_mismatch` before writes. Cache exclusion does not
permit applying a plan prepared for an earlier package build.

## Verification boundary

Use real worktree snapshots, public bin/SDK and target-native consumers. Build Core
before CLI; install the exact packed pair in a throwaway to verify package exports
and dependency rewrite. Preserve full Plan1/Plan2 and ordinary update regressions,
minimum Python 3.9 support and shipped/dogfood parity. This is targeted maintenance
acceptance, not the full release/platform matrix or Guru overlay/business acceptance.

Candidate freshness regression must use an isolated public package: prepare with
cold caches, let a real Python import create bytecode, then execute the original
plan successfully. A real source/build edit must still fail before target writes.
Do not make CI disable bytecode or serialize tests to hide cache-sensitive hashes.

The supported unversioned local session includes both the historical singleton
`current_task` shape and the original 0.6 `set_active_task` metadata shape:
`platform`, `last_seen_at`, `current_task`, `current_run: null`, plus the
writer's optional session/conversation/transcript string aliases. Maintenance
classifies these as path carriers; native current execution still stops with
maintenance-required for a positively supported old selected Task.

### Native schema-1 session metadata

#### Scope and signatures

`classifySessionCarrier(value, selected)` on Core `/task/maintenance` also
recognizes schema-1 records emitted by the original native `set_active_task`
writer. CLI `maintenance.inspectTaskTarget` and both selected-Task preparation
APIs consume that classification; their signatures and current native execution
authority are unchanged. The original writer is traceable at
`43fffc170927c85d9f7fc106cc5a059e80d4530b`, shipped
`common/active_task.py`, `_context_metadata` and `set_active_task`.

#### Closed contract

Keep the existing exact four-field schema-1 form (`schema_version: 1`,
`repository_common_dir`, `task_workspace_root`, `current_task`). The writer form
adds required nonempty strings `platform` and `last_seen_at`, plus required
`current_run: null`. Only these optional nonempty string aliases are allowed:
`session_id`, `sessionId`, `sessionID`, `conversation_id`, `conversationId`,
`conversationID`, `transcript_path`, `transcriptPath`, `transcript`.
Metadata is predecessor context, never Task/Delivery execution authority.

Both forms retain existing absolute workspace/common-dir validation and resolve
the original workspace plus `current_task` against the selected Task path and
repository common directory. Do not infer ownership from platform/session IDs.

#### Validation and cases

| Input | Result |
| --- | --- |
| Complete writer form selecting the exact Task/workspace/common-dir | `path1`, `matches: true`; include in explicit selected dispositions. |
| Existing exact four-field form | Existing `path1` behavior. |
| Supported form naming another Task/workspace/common-dir | `matches: false`; exclude from selected writes and preserve bytes/modes. |
| Unknown field, partial metadata, empty/non-string metadata, non-null run slot | `unsupported_carrier`; do not silently skip it. |

Good: inspect shared storage containing both selected and unrelated complete
writer records. Base: inspect the original minimal schema-1 form. Bad: strip
metadata from real source records or accept arbitrary keys to bypass the error.

#### Required regression proof

Core tests use writer-derived metadata-bearing schema-1 inputs and cover the
finite aliases, minimal form, ownership mismatches and closed-format rejection.
CLI real-Git/shared-session tests cover inspect/prepare, conversion and historical
closeout, selected fixed-plan effects, unselected bytes/modes, same-operation
recovery and rollback through existing maintenance APIs. Keep metadata intact.

Wrong: catch classification errors before ownership filtering and ignore those
records. Correct: positively recognize supported predecessor formats in Core,
then apply the existing selected-ownership filter. This compatibility repair does
not change current writers, full migration semantics or downstream acceptance.

Regression coverage must include an original old `task.py start` creating a
second same-Task session after closeout preparation: applying the old plan must
leave the Task, archive, recovery state and both sessions unchanged. A newly
reviewed plan includes both carriers and completes with no native selection of
the archived Task. Partial retirement and completed-result recovery use the
same freshness rule. Do not merely retire the original list and report success
while a normally created, unreviewed session still selects the removed Task.


## Selected manually archived Task resume

### Scope and trigger

Use `task_resume` only for a positively recognized legacy or schema1 manually
archived Task whose original owner reviewed the history and confirmed no pending
private closeout transaction. Current schema2 formal archives retain formal
`reopen_task` semantics; this operation never supplies its missing Completion.
The source archive is read-only history; one ordinary active schema2 Task becomes
execution authority. Generation is preserved because no formal completed lifecycle
is being reopened. No alternative TaskId, empty Delivery or completion is created.

### Public signatures

```sh
trellis maintain inspect-task --target /project --task-id selected --generation 0 --task-ref .trellis/tasks/archive/2026-10/manual-history --original-task-ref .trellis/tasks/original-location --json
trellis maintain prepare --input /private/resume-input.json --json
```

```ts
import { maintenance } from "@mindfoldhq/trellis";
const plan = maintenance.prepareArchivedTaskResume(reviewedInput);
const result = await maintenance.applyMaintenance(plan, {state_dir});
// result.resumed_task = {key: {task_id, lifecycle_generation}, task_ref}
```

The prepare envelope is `{kind:"task_resume",input:ArchivedTaskResumeInput}`.
Core `/task/maintenance` exports `ArchivedTaskResumeIntent` and
`validateArchivedTaskResumeProjection(source,projection,facts,intent)`.
Capability remains `maintenance_api:"1.0"` with additive `task_resume` and
`archive_resume:{task_families:["known_legacy","schema1"],generation:"preserve",
original_archive:"read_only"}`. Check this capability plus actual source/build
identity; matching version labels do not establish matching implementations.

### Request, result and provenance

`ArchivedTaskResumeInput` extends conversion with:

- `task_ref`: exact archive root in the finite `archive/YYYY-MM/directory` layout.
- `original_task_ref`: explicitly reviewed direct active path before manual
  archival; never infer it from the archive basename. It may differ from destination.
- `active_ref`: absent direct active destination. Existing same TaskId at any
  generation in the target checkout blocks restoration.
- `resume_intent:{reason:AuthorityRef,archive_review:AuthorityRef,
  next_owner_id:string,next_action:string}`. Each string is nonempty; references
  are verified. The caller reviews real history, scope and private transactions.
  The executor records intent without interpreting or running the next action.
- Complete schema2 `projection` with accepted scope evidence, unchanged identity,
  generation/source/metadata/tree, no Completion/Closure, no imported gate results
  or active Deliveries. Real historical delivered outcomes may be attributed by
  original owners; unknown facts remain source snapshots.
- `artifacts`: complete archive-relative retained file dispositions. Preserve
  source files; only Delivery planning projections may use `write`. Paths map to
  the active destination; projection authority/plan refs must resolve there or in
  retained readable sources. All Delivery planning files remain required.
- `sessions`: exact inspected carriers with `preserve`, `replace` or `retire`, and
  `delivery_id:null`. Replacement produces schema3 Task selection with no Delivery.
  Retire removes selected obsolete carriers; preserve grants no new authority.
  `branch_binding` uses the existing preserve/explicit-establish contract.

The raw archive tree, bytes, modes and empty directories remain intact. Active
`migration/source-task.json` retains original record bytes;
`migration/archive-resume.json` retains archive/original path, key and reviewed
intent. The frozen operation contains destination/preimages and fixed candidate.
`resumed_task` is returned from that same plan on apply/recover/resume/rollback;
status determines whether it is currently applied. It is a routing identity, never
proof that the next semantic owner passed or business work completed.

### Validation and error matrix

| Condition | Diagnostic / behavior |
| --- | --- |
| Missing or malformed explicit intent | `resume_intent_required` before writes. |
| Invalid paths/input or absent destination constraint | `invalid_task_path`, `invalid_input` or `conflict`. |
| Unsupported predecessor/current schema archive | `unsupported_source`; formal current archive uses reopen. |
| Key/source mismatch or ambiguous live ownership | `target_key_mismatch`, `ambiguous_authority` or identity conflict. |
| No accepted scope / manufactured completion / inherited gates / live or empty Delivery | `accepted_scope_required`, `formal_lifecycle_conflict`, `inherited_gate_conflict`, `historical_outcome_required`. |
| Changed source/build/preimages or unreviewed carriers | `candidate_mismatch`, `stale_source` or `later_work_conflict`; no expanded write set. |
| Later task files, scope changes, same-ID active records or sessions before rollback | Refuse rollback and preserve later work. |
| Old reader incompatible with current data | Existing tools rollback compatibility diagnostics remain in force. |

Path carriers may name the selected archive or explicitly reviewed original
active path; identity carriers match the exact Task/generation. Platform metadata
never proves ownership. Other tasks/sessions/checkouts remain outside the write
set. Inherited copies can establish ownership but are never conversion targets.
A newly attributable carrier after preparation blocks apply/result recovery and
rollback; original source/target states remain valid for ordinary partial replay.

### Good, base and bad cases

Good: preserve a manually archived delivered slice and its real commit, restore
same Task/generation with no current Delivery, then let the target-native scope
owner review a supplement without changing historical outcomes.

Base: no attributable session exists; establish a reviewed Git branch binding and
use the legal explicit-task route. No fabricated session or Delivery is necessary.

Bad: move the archive manually, create a replacement Task, infer a pass from old
status, or call formal reopen with invented Completion to bypass its guard.

### Required tests and evidence

Core validates intent, finite predecessor/projection semantics and explicit path
carrier selection. Real-Git CLI tests cover retained bytes/modes/history, all
same-ID generations, original-path ambiguity, exact bindings/session dispositions,
new carrier/source-tree freshness, same-operation retry/lost output/partial apply,
rollback and later-work conflicts. Keep active conversion, history-only closeout,
formal reopen and complete Plan2 regressions.

Install actual packed matching CLI/Core into one isolated prefix; use the public
bin before tools cutover, then target checkout's installed native identity,
continuation and actual next public consumer. Record source SHA/package digests,
API, platform/template coverage and limits. Shipped/dogfood parity applies to any
changed native files. Guru private-owner/joint validation is separate evidence;
a mock, DTO parse or external tool execution cannot stand in for it.

### Wrong versus correct

Wrong: derive original active path from archive basename, advance generation or
copy old gates to make continuation appear successful.

Correct: caller explicitly reviews original path/history/next owner, public Core
validates a same-generation projection, fixed-plan maintenance creates one active
record, and target-native consumers establish actual continuation independently.


## Python operation boundary

Tools inspect/prepare/application and applied recovery/resume use the [shared Python selection contract](./configurator-shared.md#scenario-python-selection-across-process-boundaries-issue-53). Resolve automatic selection before tools mutation; postvalidation uses executable/argv, including the real Windows launcher. Preserve other maintenance kinds and existing operation identity/staleness contracts.


## Native Windows tools file modes

When preparing tools-install target snapshots, preserve the actual existing file
mode on Windows and use Windows writable mode (0666) for new files. POSIX hosts
continue requesting 0755 for executable scripts and preserving other source
modes (0644 for new text files). Receipt defaults use the same host semantics.
Do not demand POSIX execute bits that Windows chmod/stat cannot round-trip.
Raw snapshots and equality still retain exact supported modes: do not strip
mode evidence globally or waive target comparison. Native apply followed by
fresh-process recover and resume must remain applied with no phantom pending
paths; Linux/macOS script modes must remain executable.
