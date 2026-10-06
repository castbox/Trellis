# Task Lifecycle

## Task Records

`task.py create`, `trellis init`, and task factories write the current task
schema. Task selection uses explicit task arguments or a validated session
binding. `task.py list` and the default context support status filtering and
project task inventory; the current session task is reported separately.

`task.py create --source-json` accepts `no_issue` (also the default) or an
Issue source with `exact_source` or `reference_only` disposition. The supplied
Issue source is preserved through create, read, session start, rename and
archive. `reference_only` records a relation to the Issue; it does not assert
complete delivery or authorize Issue closure. Creation performs no GitHub
closure action. Other dispositions remain readable in existing records but
are not accepted by this creator.

The outer Trellis workflow owns task creation, planning paths, context
manifests, artifact review, and activation. `trellis-brainstorm` can explore
requirements without a task. It writes to a caller-provided destination or
returns planning content in conversation.

## Session Binding

`resolve_active_task` returns the task path, source type, context key, stale
state, invocation root, repository common directory, task worktree root,
resolved task path, and error. Consumers use the validated absolute task path.
Git storage is `<git-common-dir>/trellis/sessions/<key>.json`, schema version 2,
with `schema_version`, stable `task_id`, and `lifecycle_generation`. Non-Git
projects use checkout-local storage with the same schema.

`task.json.id` is stable across rename and archive. The required
`lifecycle_generation` must be a non-negative integer and cannot be a boolean;
`children` must be a list and is the sole task-tree field. Records with
unsupported or missing fields, invalid field types, invalid source data, or
non-JSON metadata are rejected at every Python task read/write boundary, as in
Core. An existing invalid record cannot be overwritten with new data. Create
and lifecycle mutations
reject exact and Unicode case-fold TaskId collisions across active and archived
tasks. Active inventory scans reserve positively known legacy TaskIds without
exposing those records as current lifecycle candidates; unrelated known legacy
records do not block current task lookup. Direct legacy selection and exact or
case-fold identity occupation fail closed. Malformed active current records,
invalid JSON, and missing ids block inventory resolution rather than being
silently skipped.

Registered Git worktrees determine membership. Resolution requires one exact
TaskId and generation match. Missing, ambiguous, corrupt, or unsupported
bindings are stale and require an explicit `task.py start`; reads do not rewrite
them or infer a different session. Non-Git resolution is invocation-local.

Finish clears the selected session. Archive clears bindings matching the
archived TaskId and generation. Rename changes the directory, mutable name,
and TaskRef references while leaving session bytes, TaskId, and generation
unchanged. Lifecycle hooks run from the task worktree.

## Archive and Paths

Archive stages only the selected task and its destination. User-owned task
content is retained. File operations validate project containment, symlinks,
and managed-file ownership before reads or mutations; a parent directory check
does not validate its children.

Use real Git worktrees and hook entry points to verify session resolution,
rename/archive, collisions, corruption, unregistration, and non-Git behavior.

## Current Record Boundary

### 1. Scope / Trigger

Apply this contract whenever Core or Python reads or writes `task.json`,
including session resolution and lifecycle mutation.

### 2. Signatures

- Core: `taskRecordSchema.parse(input)` and `writeTaskRecord(options)`.
- Python: `read_json_checked(path)` and `write_json(path, data)`.

### 3. Contracts

Every field in `TASK_RECORD_FIELD_ORDER` is required. `branch` alone is
optional. `children` is the task-tree list; `source` is either `no_issue` or a
structured issue reference. `meta` is a JSON object. Both runtimes reject
unknown top-level fields and validate the same field types.

### 4. Validation & Error Matrix

| Input | Result |
| --- | --- |
| Current record | Read or write succeeds. |
| Missing, extra, or mistyped field | Read fails; an existing record is not overwritten. |
| Invalid source or non-JSON metadata | Read fails; an existing record is not overwritten. |
| Missing or mismatched session binding | Session-bound selection fails until an explicit start; an explicit task argument remains usable. |

### 5. Good / Base / Bad Cases

- Good: a record from `task.py create` or `emptyTaskRecord` with current fields.
- Base: a valid record with no `branch`, no children, and `source.kind=no_issue`.
- Bad: a record missing `source` or carrying an unknown top-level field.

### 6. Tests Required

Assert Core and Python acceptance of a complete record, rejection of missing
or extra fields, and byte-for-byte preservation when an invalid existing
record is passed to a writer. Exercise task selection and mutation with a
current record through the generated Python templates.

### 7. Wrong vs Correct

Wrong: fill absent fields while loading and continue with the modified record.
Correct: reject it at the read boundary and leave its bytes untouched.
