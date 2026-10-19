# Implementation plan and progress

- [ ] Extract/reuse Python resolution and shell-free invocation across all Issue consumers; add meaningful regression tests.
- [ ] Add standalone public CLI native driver and explicit Windows/Unix CI matrix plus baseline/candidate comparison and evidence artifacts.
- [ ] Update entry docs and relevant specs; independent full-scope Trellis check.
- [ ] Run build, lint, TS/Python checks and full tests, packed paired install smoke.
- [ ] Commit, PR, inspect all native CI (including exact baseline/candidate assertions), fix any failures, merge only on green.
- [ ] Bump paired Castbox version, validate immutable assets at exact main, tag/release, download verification; record evidence, close Issue and archive Task.

Authorization: user explicitly authorizes all repository/Issue operations through release and accepts preferred options. Planning reviewed against complete live issue; no user-owned decisions remain. Existing workflow is native legacy (missing_runtime_contract); continuation loaded from live workflow.


## Implementation and independent static check

- Shared selector extracted to `utils/python.ts`, old init exports preserved.
- New-operation update/prospective/workflow selection precedes preflight/rendering. Native preflight/tools contract/context use executable plus prefix argv.
- Tools apply/recover/resume compare frozen replacement bytes to the current rendered candidate before writes/validation; changed choice returns existing stale_source without new state/schema.
- Targeted runtime 113 tests passed, engine seam 10/10, full platform projection includes python/py -3 and POSIX python3. Independent static checker reports no remaining substantive findings; lint and TS checks passed.
- Python typecheck: 0 errors, 48 warnings. Core tests: 484 passed, 1 skipped.
- Local macOS real public-CLI driver: 59 commands/121 assertions passed (dirty working source, recorded dist digests; not native Windows proof). Real local Git custom marketplace fixture records URL rewrite and source, no external transport claim.
- Full-suite first run exposed a missing test mock export (fixed), concurrent candidate source edits/timeouts, and archive cleanup race. Frozen retry had 2380 pass and only archive cleanup ENOTEMPTY. Fixture-local background Git maintenance disabled; archive-only 6/6 pass. Final complete rerun pending.
- Paired 0.7.0-castbox.5 tarballs prepared, exact CLI/Core dependency verified. Publication awaits CI and installed evidence; no npm publication.

- Frozen full rerun cleared archive race; 2379 passed and two 10s timeouts remained (platform registry projection / existing cross-worktree session test). Retrying complete CLI suite with maxWorkers=4, preserving original timeout and all assertions. Normal CI keeps its original runner/testing strategy.
- Isolated paired local installation passed: exact .5 core resolution and 10 real public init/update/maintenance/workflow/recover/resume calls.
