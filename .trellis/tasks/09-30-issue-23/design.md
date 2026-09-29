# Issue #23 Technical Design

## Runtime and Model

Remove personnel fields from Python TaskData/TaskInfo, task loading, creation, queue results, list filters and context output. Remove personnel-filter helpers and CLI flags rather than redirecting them to another identity source. Update deprecated-script diagnostics so they do not recommend retired flags. Remove task-derived Linear personnel mapping and its configuration examples; retain unrelated Linear issue operations.

Remove personnel fields from the core record interface, field ordering, validation and empty-record factory. Legacy fields become generic unknown JSON properties: structured loads ignore them and existing generic raw merge/write behavior preserves them without inspecting values. New factories never populate them. No one-time data migration is needed.

Remove init/update options, interactive prompts and ownership preflight. Bootstrap and migration tasks use the same remaining task schema. Preserve task source, lifecycle identity, session bindings, priority, task tree and unrelated archive behavior.

## Brainstorm and Caller Ownership

The common brainstorm template is the canonical behavior source. Its input is a requirement/problem plus optional evidence context and caller-provided output destination. An active task is optional and is not selected by the skill. It explores evidence, asks one substantive decision at a time, converges requirements and produces requirements/design/execution-plan content as appropriate.

Remove task CLI commands, directory creation/selection, ownership questions, activation/archive operations, lifecycle confirmation gates and task JSONL validation from brainstorm. If no output path is supplied, return planning content in conversation without filesystem lifecycle effects. Preserve requirement convergence, lossless consolidation, evidence-first questions and a reviewable final planning summary.

Outer workflow owns consent, task creation and paths, then invokes brainstorm with that destination. It owns context manifests, artifact review, explicit implementation approval and activation after brainstorm returns. Synchronize start/continue hooks, commands, descriptions and workflow breadcrumbs so they neither delegate lifecycle ownership back to brainstorm nor depend on personnel input.

## Distribution and Historical Boundaries

Derive platform generation coverage from the live platform registry. Edit canonical templates first and synchronize tracked installed copies using existing project tooling or narrowly scoped generation. Include bundled meta references and Python examples that currently teach retired fields. Maintain a classified scan: legacy records/release evidence, retirement instructions and unrelated external assignment are permitted; active task consumers are not.

Do not edit independent submodule repositories as part of source synchronization. Record relevant external maintained references and downstream follow-up explicitly.

## Breaking Compatibility and Versioning

Document removal of personnel CLI flags, SDK record fields, Python fields and personnel queue helpers. Old callers must omit these inputs; unsupported flags produce ordinary argument errors rather than being consumed or recorded. Old task JSON requires no migration or supplemental information.

Add a breaking migration contract to the next installable castbox release candidate, maintaining paired CLI/core versions according to the existing fork delivery policy. Establish the exact unused version during implementation from live release/manifests, before writing the manifest; do not attach this breaking behavior to an already released version or publish implicitly.

Use existing update/reapply and template conflict handling. Verify unchanged installed files converge, customized files are preserved/reported according to policy, and stale instructions cannot be reported as successfully resolved. Migration AI instructions describe the new interface and do not replay historical personnel requirements.

## Validation and Rollback

Test new creation, bootstrap/migration factories, text/JSON listing and context; legacy records with and without old fields; continuation/archival and generic field preservation; rejected old options; taskless brainstorm contract; caller-owned lifecycle; full registry generation; installed update/reapply conflicts.

Run meaningful targeted tests, then repository lint/typecheck/build and full existing suites for the shared-model blast radius. Static skill checks establish prompt contracts; actual Guru model behavior requires downstream validation and must not be reported as passed from static inspection.

Rollback is a scoped revert of this change and its unreleased migration contract. Historical tasks are never transformed, so no reverse personnel-data migration is needed.
