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
`.trellis/tasks/<directory>` locator. Known preidentity legacy and strict schema1
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

CLI prepare takes `{kind,input}`; kind is `tools_install`, `task_conversion` or
`legacy_closeout`. SDK has separate typed preparation functions. Exact exported
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

Regression coverage must include an original old `task.py start` creating a
second same-Task session after closeout preparation: applying the old plan must
leave the Task, archive, recovery state and both sessions unchanged. A newly
reviewed plan includes both carriers and completes with no native selection of
the archived Task. Partial retirement and completed-result recovery use the
same freshness rule. Do not merely retire the original list and report success
while a normally created, unreviewed session still selects the removed Task.
