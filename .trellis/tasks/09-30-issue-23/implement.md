# Issue #23 Execution Plan

## Gates

- [x] Read live Issue #23 and inspect affected runtime/model/template callers.
- [x] Create planning artifacts and curate agent manifests.
- [x] Present final planning summary and obtain subsequent explicit implementation approval.
- [x] Establish the reviewed branch/base and resolve the two-commit local main lag before implementation; preserve the planning task and session binding.
- [x] Load Phase 1.4/2.1 continuation contracts, validate manifests, activate the task and dispatch implementation.

## Ordered Work

1. Inspect relevant backend, Python, SDK, migration and unit-test specs; record any Issue-authoritative changes to old ownership guidance.
2. Remove Python/TypeScript task personnel contracts and runtime consumers. Adapt init/update, deprecated diagnostics and task-derived external hook mappings. Keep raw legacy field preservation.
3. Rewrite canonical brainstorm behavior and descriptions. Move lifecycle requirements to workflow/start/continue and preserve normal Trellis planning approval.
4. Synchronize generated platform assets, dogfood scripts, maintained specs/docs/examples and affected tests. Classify scan matches without changing historic artifacts or unrelated assignment semantics.
5. Choose an unused paired castbox candidate version using live release evidence; add breaking migration guide and AI instructions. Verify installed update/reapply with conflict cases.
6. Dispatch independent Trellis check agent, repair verified findings, update specs and record verification evidence.
7. Report exact local completion, installation/publication gates and Guru #481 handoff. Execute remote delivery only when authorized.

## Verification

- Core task schema/record suites: no personnel schema; old fields ignored on structured reads and preserved by generic existing-record writes.
- Python script integration suites: create/list/context/continue/archive without personnel fields; legacy records remain usable; old flags rejected.
- CLI init/update integration suites: no ownership prompts/options, bootstrap and migration record shape, preserved existing task data.
- Template/regression suites: taskless brainstorm, outer lifecycle ownership, registry-wide generated coverage and installed update/reapply.
- Classified `rg` scan across canonical source, generated assets, dogfood and maintained docs. Exclude only documented historic data and unrelated assignment contracts.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test` after targeted regression coverage. Record environment-blocked checks distinctly.
- Do not infer published installation or live Guru reuse from a source/template test.

## Risk and Rollback Points

Shared task schema and Python queue helpers are public API breaks; enumerate callers before removal. Prompt changes can accidentally weaken the outer planning review gate; verify both taskless and ordinary workflows. Preserve existing archive defaults and session source/binding semantics. Review all diff paths before synchronization and before delivery.

## Local Evidence and Remaining Gates

- Branch `codex/issue-23-retire-task-personnel` began at refreshed `upstream/main` `8336e78b`; the task remains bound to this session.
- Implement and independent check agents completed source, template, local installed-copy, migration-helper, documentation and test changes. The checker repaired missing manifest `aiInstructions` and stale installed skill behavior.
- Final serial verification: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`, `bash -n packages/cli/scripts/migrate-features-to-tasks.sh`, `git diff --check`; core 425 passed/1 skipped, CLI 2321 passed. Copilot/Trellis template tests were repeated after restoring Copilot prompt frontmatter: 38 passed.
- Classified active-source scan: no remaining task personnel CLI calls or reads; matches are retirement guidance/tests, historical data, and unrelated channel-thread assignment. `task.py validate 09-30-issue-23` passes with context-injection size warnings for two large specs.
- Candidate `0.7.0-castbox.1` and its breaking manifest are local only. No package publication, global install, downstream Guru #481 run, PR, merge or Issue closure is proven.
- The user approved one local commit on `codex/issue-23-retire-task-personnel` after reviewing the 89-file Issue #23 scope. Remote delivery remains a separate authorization gate. Do not archive this task as complete before any required fixed-version handoff is resolved.
