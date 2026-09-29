# Retire Task Personnel Metadata and Decouple Brainstorm (#23)

## Goal

Remove Trellis task personnel registration from every supported workflow and let callers reuse requirement exploration without creating or activating a task.

## Source and Background

- Source: https://github.com/castbox/Trellis/issues/23, read on 2026-09-30; no comments at inspection.
- Python task creation currently validates personnel input in `packages/cli/src/templates/trellis/scripts/common/task_store.py:419`; task listing, queue and context also consume it.
- The public TypeScript model requires personnel fields in `packages/core/src/task/schema.ts:29`; bootstrap and migration factories collect and persist them.
- `packages/cli/src/templates/common/skills/brainstorm.md:27` requires task consent and creates a task. Shared skill descriptions, workflow steps and platform prompts distribute that requirement.
- Existing raw-record preservation allows legacy data to remain without keeping retired fields in structured public models (`packages/core/src/task/records.ts:81`).
- This task's existing fields are historical data, not a target for backfill or deletion.

## Requirements and Acceptance Criteria

| ID | Requirement | Observable acceptance |
| --- | --- | --- |
| R1 | Retire task personnel input, fields, filters, resolution, validation, recording and display. | Task create, bootstrap init, migration update, list, context and supported task lifecycle work without personnel input; newly written tasks have no personnel fields. Old CLI flags are unsupported and rejected. |
| R2 | Preserve legacy task usability without personnel semantics. | Tasks with absent, present or irrelevant legacy field values load, continue, check and archive identically. Generic write-back preserves unknown historical data; no batch rewrite, backfill or replacement identity is performed. |
| R3 | Make brainstorm a standalone requirement exploration skill. | With no current task, it can inspect evidence, clarify real product decisions, converge requirements and deliver planning content. It does not create/select directories or tasks, bind sessions, start/archive tasks, or ask lifecycle consent. The caller supplies the output destination; absent a destination, planning content is returned in conversation. |
| R4 | Keep normal Trellis orchestration usable. | Outer workflow/start/continue steps explicitly own task consent, creation, output paths, context manifests, planning approval and activation. Existing product clarification and final planning review remain effective. |
| R5 | Converge supported distribution surfaces. | Canonical source, generated platform skills/commands/prompts, dogfood copies, maintained specs, examples and tests agree. Registry-derived coverage finds no active requirement or consumption of retired task personnel fields. |
| R6 | Define breaking migration and installation behavior. | Versioned migration guidance identifies removed CLI/model/helper APIs and explains update/reapply for untouched and customized installed files. Customized stale guidance is reported as unresolved rather than falsely considered migrated. Historic task records and old release evidence are preserved. |
| R7 | Validate relevant reuse and handoff. | Verification covers ordinary Trellis, all declared generated platforms, installed update/reapply and taskless brainstorm caller contracts. Guru #481 receives upstream compatibility evidence after an installable candidate exists; downstream implementation and production settings are outside this task. |

## Scope

Python runtime and dogfood twins; CLI/core task contracts and callers; init/update; Linear hook personnel mapping derived from Trellis tasks; canonical common skills, descriptions, workflows and platform entry points; generated project assets; maintained in-repository documentation/specs; compatibility and generation/install tests; breaking migration documentation and version metadata.

## Out of Scope

- Git commit author metadata, GitHub Issue/PR assignment and unrelated channel/forum assignment semantics.
- Rewriting previous task artifacts, archived evidence, historical release manifests or Git history.
- Direct changes to the independently owned docs-site/marketplace submodule repositories, global installation, Guru #481 implementation or production configuration. Report maintained external documentation gaps for handoff.
- Adversarial, concurrency or unrelated session-routing hardening.
- Push, PR, tag, publication, merge and Issue closure are separate delivery actions.

## Planning Status

Issue scope resolves the behavioral decisions. No blocking product question remains. Planning review is required before activation. Local validation is distinct from published installation and downstream runtime validation.
