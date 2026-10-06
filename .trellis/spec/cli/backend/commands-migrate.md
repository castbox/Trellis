# `trellis migrate` Command

This explicit one-way executor supports core `0.6.16` to the candidate CLI
version. Ordinary `init`, `update`, and task readers/writers remain current-only.
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
The fixed `0.6.16` profile additionally recognizes precisely
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
actual managed/task updates, preservation, same-plan resume, explicit custom
file choices, stale task projections, omitted legacy tasks, and strict ordinary
update rejection. Guru end-to-end rehearsal owns real old installation,
workflow/preset installation, lifecycle re-entry and post-write rollback proof.

Native task inventory scanners reserve known old TaskIds without exposing
them as current candidates. Creation and session resolution remain usable for
unrelated current tasks. Exact/casefold old identity occupation and direct old
selection fail; bad active current records, JSON or missing ids also fail.
The standard task reader/writer is unchanged and accepts only current records.
