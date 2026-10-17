# Implementation and verification plan

- [x] Read live Issue/main, current-session identity and specs; map public callers.
- [ ] Complete fixed baseline harness and before measurements; persist immutable numeric gates before production edits.
- [ ] Review planning artifacts and activate this exact Task (user preauthorized preferred implementation).
- [ ] Dispatch Trellis implementer: batch Task history and Delivery immutable reads, operation-local digest reuse, bounded temporary resources; register/mirror templates.
- [ ] Add public-entry semantic/regression tests for identities, paths/modes/types/deletions/errors, mutable calls and recovery; preserve original digest bytes.
- [ ] Run identical after benchmark; compare all frozen gates, Git counts, unique/read bytes, hash counts and separate RSS. Any missed gate requires correction, never a relaxed threshold.
- [ ] Dispatch Trellis checker for full scope; run lint, TS/Python typecheck, build and relevant/full tests as appropriate.
- [ ] Verify paired package packing, isolated installation and applicable template projection/reapply/drift/sidecar/mode behavior. Record exact commands and limits.
- [ ] Update specs with concrete operation-local batch/digest contract; commit only issue scope, publish/review/merge PR, verify remote results.
- [ ] Report final source/installable artifacts and evidence on Issue #47 with downstream backlink; archive exact completed Task and preserve unrelated work.

Primary validation: pnpm lint; pnpm typecheck; pnpm --filter @mindfoldhq/trellis lint:py; pnpm build; pnpm test. Focused suites: task-identity-source, delivery-v2, delivery-location, delivery-workflow, update-current-version, cross-worktree-update, regression. Benchmark command and frozen thresholds live in research/benchmark.py and research/performance-gates.md after measured baseline completion. Baseline source remains b0d87f952043058e21001a002b661bf2db56b1fa; one warmup and two timed repetitions, deterministic inputs, warmed OS cache, local network-free operations.
