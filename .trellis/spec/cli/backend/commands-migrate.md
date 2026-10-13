# `trellis migrate` Command

The private plan's `schema_version` selects the executor. Plan 1.0 retains its
original predecessor-to-legacy projection through the explicit legacy SDK
namespace. Plan 2.0 performs the reviewed Task/Delivery cutover described below.
Implementing migration is separate from retiring the default compatibility path;
global retirement is future breaking-release work outside #31, with its own
public replacement/version guidance and affected-consumer cutover evidence.
Upstream migration acceptance does not wait for downstream or joint validation.
See [Delivery Lifecycle](./delivery-lifecycle.md).

The plan-1.0 one-way executor supports actual core `0.6.x` and
`0.7.0-castbox.N` predecessor installations to the candidate CLI version.
The source is the installed `.trellis/.version`, not a Guru release tag or
extension revision. For plan 1.0, a same-version install uses ordinary
`update`, and a source at or above the target is not an upgrade. Plan 2.0 also
supports an explicitly declared same-package-version schema cutover. Ordinary
`init` and `update` do not migrate authority; selected task readers/writers
require the schema declared by the active workflow.
It does not choose task sources, review planning, establish branch/session
bindings, install a Guru preset, or execute remote delivery.

## Invocation and private plan

```sh
trellis migrate --from 0.6.16 --plan /path/to/private-core-plan.json --dry-run
trellis migrate --from 0.6.16 --plan /path/to/private-core-plan.json
```

The caller owns inventory, AI review, dialogue-local side-effect confirmation,
backup, ordinary failure recovery, and rollback. The plan contains no approval
or authorization data. Do not run execution without backing up the exact preview
write set. Keep the plan and backup outside tracked repository files.

The closed plan has `schema_version: "1.0"`, `target_version` equal to the CLI,
`tasks`, and `file_decisions`. Each task has a direct active `task_ref`, the raw
old `task.json` `expected_sha256`, and a complete reviewed current `record`.
Optional `retired_fields` explicitly disposes unknown fields. Personnel fields
are retired; existing business facts, TaskId, and generation are retained.
Absent generation becomes zero. Missing fields are completed in the caller's
projection, not guessed by the normal task reader. Existing children and
nonempty string subtasks must be retained in `children`; relations that cannot
be represented losslessly block. History archives are never converted.

Optional `current_tasks` defaults to an empty list. Each entry contains
`task_ref` and the current raw `task.json` `expected_sha256`. The executor
validates the target task schema and preserves original bytes and modes;
it does not serialize the record, reset generation or rebuild control/session
state. These refs must be distinct from converted and deferred refs. A normally
edited current record makes the plan stale before the first write. Omitted
current records remain schema-validated and untouched for existing 1.0 callers.
Current task/control data is never converted merely because the installed core
version is older.

Optional `deferred_tasks` defaults to an empty list. Each entry contains only
`task_ref` and the preserved raw `task.json` `expected_sha256`. Converted and
deferred refs must be distinct and nonduplicated. A deferred record must match
the positively known old header (portable id, name/title/status and personnel
strings; no current source/generation or unknown fields). Preview exposes an
explicit `preserve` action; execute and resume require the original bytes.
Omitted old active records and malformed current records still block. Deferral
does not make an old task usable by current readers, bindings or sessions.

Each file decision has `path`, `action` (`replace`, `preserve`, or `remove`),
and raw `expected_sha256` (null for absent). Unknown template edits need an
explicit decision; missing or receipt-equal files can update automatically.
Retirement requires exact receipt-owned core bytes in the core namespace.
The migration boundary additionally recognizes precisely
`.agents/skills/trellis-meta/references/local-architecture/workspace-memory.md`
and the same reference below `.claude/skills/` and `.cursor/skills/`. These
retired public references come from source
`ad332e3fe5a19d7274cb03e7c2f3e2128f8de291`; a reviewed remove decision, the
old receipt and expected raw bytes must still match. This list grants no
ownership over arbitrary sibling references or platform directories.
Preview also enumerates receipt-owned retired core paths absent from
target templates. Without an explicit remove/preserve decision each is shown
as `preserve` with a conflict, so execution cannot silently omit retirement.
Workflow, config, gitignore, specs, historical identity/journals/traces, and
business data remain with their existing owners. Registry spec downloads do not
run during migration. Current template collection and platform customization
preservation reuse the update implementation.

## Preview, execution, and recovery

Stdout is a single JSON result with `status` (`preview` or `migrated`), source
and target versions, `actions`, and `conflicts`. Each action reports path,
write/remove/preserve, raw pre/post SHA-256 and permission bits (null for absent).
This is private backup/recovery information, not a semantic gate or public Skill
handoff. A dry run writes nothing. Execution validates all task and file
projections before the first write; unresolved conflicts fail without writes.

Execution writes managed templates and tasks, then the hash receipt and version.
Ordinary filesystem failure can leave completed writes. The same caller-owned
plan can resume: original task bytes convert, target task bytes are left intact,
and ordinary unrelated drift blocks for renewed review. The installed version
may be old or target during that same migration. The caller restores only backed
up paths and removes its added paths when rolling back before new business work.
No Git reset, history rewriting, or automatic remote operation occurs.

## Verification

Core tests cover full/minimal projections, identity, generation, relations,
unknown fields and business facts. CLI integration covers preview zero writes,
actual managed/task updates from differing core versions, raw current task and
control preservation, same-plan resume, explicit custom
file choices, stale task projections, omitted legacy tasks, and strict ordinary
update rejection. Guru end-to-end rehearsal owns real old installation,
workflow/preset installation, lifecycle re-entry and post-write rollback proof.

Native identity scanners reserve valid TaskIds without classifying unrelated
non-identity fields or exposing records as current candidates. Creation and
session resolution remain usable beside historical records; matching selected
records still require the full current schema. Exact/casefold occupation and
direct old selection fail; bad active identity (JSON/object/id/readability)
also fails. This minimal projection does not determine migration disposition:
the reviewed current/converted/deferred rules above retain their independent
classification and raw-byte requirements. The standard complete task
reader/writer still accepts only current records.

## Plan 2.0: Task / Delivery migration

The source/target package version, Task schema and Delivery API are separate
identities. Source Task schema is `legacy` or `1.0` with no Delivery API; the
target is the candidate package, Task schema `2.0`, API `1.0`. Unlike plan 1,
same-package-version schema cutover is legal. No version switch infers approval.

The closed plan fields and their consumers are:

| Field | Required reviewed input |
| --- | --- |
| `workspaces` | Unique ID, live registered absolute project root, and contained monorepo suffix or null. Include all installed roots at that suffix in the same repository. Git-free selects the exact invocation root. |
| `installations` | Per-workspace raw version/receipt snapshots; these fixed files are executor-owned targets, never arbitrary file decisions. |
| `tasks` | Exact active/archive ref and `convert_active`, `convert_archive`, `current`, `defer` or `history_only`; original raw snapshot (null only for missing-record `history_only` roots); complete owner-reviewed v2 record for conversions. |
| `legacy_facts` within a converted Task | Every nonempty old commit/PR/date fact has an explicit producer-owned disposition: matching normalized result, or retained `source_snapshot` with reason ref. Dates cannot manufacture Completion. |
| `sessions` | Exact common-dir or workspace-local session filename, source snapshot and optional reviewed schema-3 projection. Preserve Task/generation; Delivery selection is null or a valid current-generation nonterminal identity. |
| `branch_bindings` (optional, default `[]`) | Exact TaskId/generation and raw snapshot of its existing fixed common-dir binding. Required for admitted inherited-copy groups and projected active Tasks with existing bindings; preserve-only, never a binding writer. |
| `workflows` | Per-workspace required `template_id` and exact target runtime contract, matched by the actual supplied workflow content. No replacement fallback or inferred template identity for custom workflows. |
| `templates` | Frozen candidate digest and exact owned path/raw hash/mode set from the prospective collector. |
| `files` | Typed project target, owner (`template`, `workflow`, `artifact`, `preserve`), exact action/source snapshot and optional target bytes/full mode. Ownership bounds the action; preserve grants no write capability. |

Workspace enumeration uses the closed live-root policy in
[Task Lifecycle](./task-lifecycle.md#git-inventory-with-prunable-registrations).
An explicitly obsolete sibling is not a missing required migration workspace;
all eligible live roots still require exact reviewed inventory. Git failures
never silently convert the invocation into a Git-free migration target.

A raw snapshot is `{content_base64,sha256,mode}`. The canonical base64 bytes and
raw digest must agree. Converted source Task bytes/mode remain under
`<task_ref>/migration/source-task.json` as history, never execution authority.
Identity, source, generation and business/tree metadata survive projection.
The caller chooses each Delivery scope/plan/outcome attribution; old status
never creates a Delivery or a gate. Unknown history-only archives remain raw
history with visible identity occupation, while selected conversion is strict.
Every occupied active/archive Task leaf, including empty and evidence-only
directories, belongs in the inventory. `history_only` with `source: null` means
that exact root exists but its `task.json` is absent; it reserves the visible
name and preserves every raw artifact without fabricating a record. This is
also legal for missing-record active roots. Other dispositions require a raw
record snapshot, and record-bearing active roots cannot use `history_only`.
The absent record is a frozen preimage: its later appearance is a third state.
Only typed Task/Delivery authority slots are verified as AuthorityRefs;
arbitrary business metadata is preserved even when it has locator/revision keys.
Retained local-commit results must pass Core's public historical commit verifier:
the exact commit tree bytes and Git modes must match the result's candidate
content digest. An existing commit object alone is insufficient. This read uses
the immutable tree, so later HEAD/worktree changes do not invalidate a matching
historical delivery result; malformed or mismatched results reject before writes.
Fixed Git authority refs use Core's schema-validated relative locator and
immutable object reader; a later same-name worktree symlink does not redirect
that historical read. SHA refs still validate the prospective frozen path
through containment, and every migration write target retains its symlink checks.

The prospective collector includes actual shipped runtime dependencies, agents,
platform carriers and the public Delivery contract. Its collection does not
probe the old installed runtime or write files. Supported Codex agent `model`
and `model_reasoning_effort` keys are retained using the existing configurator
helpers before candidate bytes and hashes are frozen. Execution reconstructs
those desired bytes from reviewed raw source snapshots, including during a
partial retry; edited live model keys cannot redefine the frozen candidate.
Root planning files receive
explicit raw preservation decisions; only reviewed Delivery-owned artifact
targets may receive mapped planning bytes. Each known source artifact is covered
by the plan. Retirement is limited to exact receipt-owned core template files.
Legal established storage-root aliases retain the existing boundary; nested
artifact/session symlinks do not become owned roots.

Preview exposes the entire raw byte/mode write set. All source/target states,
identity occupation, selected session/Delivery, prospective profile/authority
and workflow/template obligations are checked before the first mutation.
Replay accepts exact source or exact target bytes and modes; a third state
fails before writes. The target receipt comes from the frozen original receipt
and template plan, not a partially changed live receipt. Caller backup/rollback
restores only this preview's paths/modes before new business writes.
Workflow receipt ownership uses the same pure hash projection as the workflow
command. A bundled `template_id` additionally requires byte-identical rendered
content from that exact bundled template. Other explicit IDs are user-managed,
including copies with identical native bytes; no remote lookup is needed.
For custom write and preserve decisions, any old native workflow receipt entry
is removed. Native decisions track the actual target bytes. Contract validity
alone never grants bundled ownership. Same-plan retries derive this receipt
from the reviewed original snapshots; normal/forced reapply retains custom owners.
Every live `.json` session in the shared common directory and each registered
workspace's local session directory needs an explicit `sessions` entry, including
preserve-only records. A generic file decision does not replace that disposition.
Omitted or newly appeared sessions fail with `missing_session_disposition` before
writes; execution never freezes unreviewed live session bytes into the plan.

An already installed valid schema-2 declaration treats retained old active data
as historical-only on reapply. It reserves valid identities and preserves bytes;
exact selection/start rejects the old schema without writes. Initial switching
from a legacy declaration still requires reviewed migration. No separate
disposition ledger or permanent status/Delivery dual writes are introduced.

Verify controlled old copies with actual installed Python contract/continuation,
registered sibling worktrees and common sessions, raw modes, stale zero-write,
ordinary-failure replay and exact rollback. Plan-1 regressions remain required.
These upstream tests do not supply Guru's private migration or joint acceptance.

## Scenario: inherited active copies in registered worktrees

### 1. Scope / Trigger

Tracked predecessor Tasks can occur in several registered checkouts. Plan2 may
convert the one branch-bound execution copy and defer its inherited peers while
retaining the complete inventory. This exception does not reopen completed
upstream acceptance or require downstream joint validation.

### 2. Signatures

The existing command remains
`trellis migrate --from <version> --plan <file> [--dry-run]`. Plan2 accepts
optional `branch_bindings: {task_id,lifecycle_generation,source}[]`, where
`source` is the existing non-null raw snapshot. No Task-schema/Delivery-API or
Plan2-version change occurs. Older closed-schema executors cannot read the new
field; use the exact new candidate.

### 3. Contracts

Binding paths are derived exclusively as
`<git-common-dir>/trellis/task-branches/<task_id>/<generation>.json`. Rows have
portable IDs and nonnegative safe-integer generations. Decoded JSON has exactly
`schema_version: "1.0"`, matching `task_id`/`lifecycle_generation`, nonnegative
safe-integer `binding_revision`, and nonempty `branch_name`. No arbitrary path,
target bytes, action, normalization, repair or producer API is accepted.

An admitted repeated-ID group has identical case-exact ID/generation and
semantic immutable source (including disposition); mutable branch metadata and
planning may differ. Known legacy absence alone defaults generation to zero.
Exactly one active row is `convert_active` or `current`; every peer is valid
declared-predecessor active `defer`, in a different canonical project root and
Task directory. The reviewed binding must select that authority through exactly
one live current branch checkout across the complete eligible roots. Retain
single-entry projected authority and historical visible-name occupation checks.
Group validation uses original snapshots even after a partial migration.

Projected active Tasks with existing bindings require reviewed snapshots even
without copies. In Git topology, an extension marker file at
`.trellis/guru-team/extension.json` in any eligible root also requires existing
bindings for projected active Tasks, matching the public reader for invocation
from those roots. Git-free resolution bypasses the marker and rejects supplied
common binding rows. No unrelated historical-binding inventory is introduced.

Preview includes raw binding preserve actions with equal pre/post bytes/modes.
Deferred descendants and selected root planning stay raw; only authority-owned
reviewed Delivery artifacts may be added. Session projection selects only the
unique active authority/eligible Delivery. Recheck topology, current checkouts,
binding preimages and relevant binding absence/marker predicates before the
first write, alongside the existing entire-set source-or-target check. This
does not add locking or transactionality during the subsequent writes.

### 4. Validation & Error Matrix

| Condition | Required behavior |
| --- | --- |
| Missing, invalid, duplicate or unrelated reviewed binding | Reject before writes; never infer authority. |
| Different case/generation/source, two authorities or all-defer duplicates | Identity collision/ambiguity; no exception. |
| Same canonical root/Task directory, archive/history duplicate | Reject copy admission. |
| Detached, absent, ambiguous or deferred-peer branch selection | Checkout authority error before writes. |
| Binding raw byte/mode drift | Existing third-state conflict; execution/retry write nothing. |
| Unsafe binding path or changed topology/checkout/absence/marker predicate | Containment or preflight error before first mutation. |
| Missing workspace/Task/session/artifact or added peer Delivery target | Existing completeness/ownership rejection. |
| Exact completed/partial source-or-target replay | Resume; preserve files are not rewritten. |

### 5. Good/Base/Bad Cases

Good: two inherited Tasks each convert in their own bound checkout and defer in
the opposite checkout, retaining different branch planning. Base: unique-ID
native plan with no binding continues unchanged. Bad: convert every copy, use
history-only for nonempty active records, or omit a peer to avoid collisions.

### 6. Tests Required

Create real Git fixtures with tracked predecessor Tasks before sibling creation.
Assert complete zero-write preview, raw modes/planning preservation, order
independence, binding/source/generation negatives and canonical aliases. Exercise
final pre-write authority changes, partial failure/replay/third states and exact
rollback. Use the actual installed CLI plus Python current-task/contract/
continuation readers from both roots; direct deferred selection remains blocked.
Cover native no-marker, Git marker missing-binding and Git-free marker bypass.
Existing Plan1/Plan2 regressions remain required.

### 7. Wrong vs Correct

Wrong: reject all inherited IDs unconditionally or choose the invocation copy
after creating multiple execution authorities. Correct: validate the complete
reviewed identity group and existing binding first, project one authority, and
preserve every peer without new lifecycle facts.
