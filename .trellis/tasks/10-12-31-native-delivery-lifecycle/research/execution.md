# D1 execution record

## Authorized boundary and fresh baseline

Planning was accepted and implementation authorized on 2026-10-12. Work is on
local branch `codex/31-native-delivery-lifecycle`, based on
`5c760463680ffc10a3f26957b330c57a4b0c3ff8`. The exact legacy task was activated
with `task.py start`; this is compatibility scaffolding for building D1, not
a claim that this Task has already migrated to the new lifecycle.

Before code writes, live Trellis #31 and Guru #531/#530/#292 were reread.
Their update times, open state and empty comment lists matched Planning.
Guru main remained `a653c90b064e2435bc147f1bda0e1b7ab632f797`. The five
mandatory canonical Guru source files were downloaded again at that exact SHA
and compared byte-for-byte with Planning's read-only snapshots: all matched.

## Ownership and staging

D1 implementation owns explicit Core `/task/v2`, equivalent shipped Python
runtime, exact Delivery selection and native opt-in installation/owners. Core,
Python and native installation/entry changes are delegated to separate
`trellis-implement` agents per current workflow. Public contract/spec updates
and final checks are coordinated in the main session. No unrelated Task record,
existing worktree, submodule or business installation is migrated or removed.

The source versions remain Core/CLI `0.7.0-castbox.3`; they identify this
development source and are not a newly published package. An installable local
candidate is not a remote Delivery or release-qualified version.

D2 migration/default cutover and old-consumer retirement are pending their
approved entry condition: matching actual Guru consumer/candidate readiness.
Joint integration, original business-session recovery and the full external
platform/release matrix are not claimed by D1 fixture or native local evidence.

Commit of this working tree, push/PR, merge, publication, Task Completion,
source closure, archive and cleanup remain separate later actions.

## Final D1 checks

Final stable source was built with `pnpm build`. Core/CLI lint and typecheck
passed; the Core build plus CLI typecheck covers the root typecheck sequence.
The two package suites cover the root test sequence. Python lint had zero
errors and 48 existing unused re-export warnings. Actual `/usr/bin/python3`
3.9.6 compiled all 74 shipped/dogfood Python files; all 33 shipped runtime
script twins matched byte-for-byte.

| Check | Final result | Evidence |
| --- | --- | --- |
| Core full suite | 24 files, 437 PASS, 1 existing SQLite capability SKIP | `/tmp/trellis-31-final-core-test.log` |
| CLI final revised full suite | 86 files, 1921 PASS with `--maxWorkers=4` | `/tmp/trellis-31-final-cli-test-revised.log` |
| Core lint/typecheck | PASS | `/tmp/trellis-31-final-core-{lint,typecheck}.log` |
| CLI lint/typecheck | PASS; final revised source also passed lint/typecheck | `/tmp/trellis-31-final-cli-lint-revised.log`; `/tmp/issue31-native-preflight-final.log`; `/tmp/trellis-31-final-cli-typecheck.log` |
| Python lint | 0 errors, 48 existing warnings | `/tmp/trellis-31-final-pyright.log` |
| Complete Core/CLI build | PASS | `/tmp/trellis-31-final-build.log` |
| Context manifests and whitespace | PASS; existing large-spec truncation warnings remain explicitly handled by direct child reads | `task.py validate`; `git diff --check` |

CLI's initial unrestricted full-suite invocation passed 1914 tests and hit four
10-second test timeouts in cross-worktree/Pi/OMP cases (no failed assertions).
The complete bounded-concurrency rerun passed all 1918 without changing test
timeouts or product source. The initial failure log remains
`/tmp/trellis-31-final-cli-test.log`; it is not represented as a passing run.
After the final preflight corrections added three regressions, a further complete
bounded run passed all 1921. Final CLI rebuild/lint also passed; no Core/Python
source changed during this last correction, so their passing checks remain current.

## First local install candidate (superseded)

Final convergence review subsequently found two CLI preflight defects: direct
Task aliases skipped schema checks, and unsupported nonterminal profiles were
not rejected before workflow replacement. The first CLI tarball below is
superseded for final D1 delivery. Its passing native samples and initial suite
results remain first-candidate evidence; revised CLI candidate evidence follows
after those fixes and a fresh build/installation.

Both local tarballs were packed and installed together with npm in isolated
prefix `/tmp/trellis-31-candidate-cv34jZ/installed`, using `--ignore-scripts`.
The dependency resolves to the installed local Core, and actual `/task/v2`
functions were imported from that installation. No published predecessor was
substituted as Core. Candidate metadata is in
`/tmp/trellis-31-candidate-cv34jZ/candidate.json`.

| Package | Version | Tarball SHA256 |
| --- | --- | --- |
| Core | `0.7.0-castbox.3` | `66d7d0cad143ce01e83e54c0c09b91f3c9cf85949ea568ff18147372b3dd5d96` |
| CLI | `0.7.0-castbox.3` | `b9bc87d71df154fd4c03112d5563d1171543a3bd00062cc0ee6c8eae91c4848c` |

These digests identify the uncommitted local D1 candidate. They are not a
published package or remotely delivered/merged source candidate. Version
publication, workspace commit and PR delivery still require their own boundary.

## Installed native sample acceptance

`research/native-samples.py` invoked the actual installed CLI and Python 3.9
runtime in temporary projects under `/tmp/trellis-31-candidate-cv34jZ/samples`.
The runtime capability probe returned schema 2.0 / API 1.0. Installed workflow,
public contract and all Python scripts matched current package sources; the
three native formal-owner Skills were present.

The parent accepted the controlled sample requirements and per-slice plans,
performed exact-byte Checks, then paused all samples before full Review.
The independent read-only `delivery_review` carrier reviewed root/per-Delivery
planning, Check references, hashes and each complete candidate/range. It
reported three PASS with no findings and no sample writes; its actual report
is retained in `research/installed-review.md` and each sample's `review.txt`.

Parent readiness judgment: each complete accepted slice is the specified
retained UTF-8 line, the declared manual/local_commit profile fits its actual
outcome, and there are no remote publication payload/target obligations. The
local Task's two independent slices jointly cover its whole AC1/AC2 scope.
Before each local result write, the helper restored that slice's exact reviewed
HEAD, then selected the exact Delivery; D1 was not treated as current at D2 HEAD.

| Sample | Actual result |
| --- | --- |
| Git-free `manual-single` | One Delivery: retained `report1.txt`, all four actual gates, delivered fact, identical delivery retry `changed:false`, independent whole-scope Completion and no-mutation Closure |
| Git `local-multi` | Two Deliveries: real commits `39fa175e1f0e5b57c749a94a7e3f0347f72218ee` and `4025644041e2a8dba92155af1af1d5c102d968f5`, separate plans/selection/gates, both delivered, identical result retries, whole AC1/AC2 Completion and no-mutation Closure |

Final aggregates retained accepted artifacts, had delivered slices plus separate
Completion/Closure results and no legacy status/commit/pr_url/completedAt root
fields. Prepare/finish output is in `/tmp/trellis-31-final-samples-{prepare,finish}.log`;
exact keys, candidates, scope/plan refs are in the sample `samples.json`.
Temporary Git commits and detached switches occurred only in the validation
repository, never this workspace. The generated onboarding Task is separate
from each accepted sample Task and is not claimed completed.

## Quality findings and remaining boundaries

Independent D1 quality review fixed current-authority drift bypass, normal
profile/replay bypass, root-alias containment inconsistency and v2 hook error
fallback. Regressions are included in the passing suites. Custom v2 bootstrap
now creates only a Task; its owner chooses accepted scope/profile. Native
Codex parent resolution explicitly disables inherited environment overrides.
Final convergence also corrected workflow preflight alias/schema and active
profile checks. Thirteen targeted native installation tests pass; the complete
1921-test CLI suite includes the same regressions. The final quality reviewer
reported no remaining actionable D1 defect.

Current gate slots intentionally retain only current results. Changed payloads
under retained IDs conflict; revised invocations require new producer IDs.
Cleared IDs are not kept in a separate ledger. The public contract/spec/design
state this accepted limitation; immutable terminal/completion/closure history
remains retained.

D1 local implementation, quality checks, build and revised-candidate native
installation/sample evidence are complete.
No workspace commit/push/PR, remote PR profile execution, actual Guru installed
integration, original business-session recovery or release qualification has
occurred. D2 migration/default cutover/legacy retirement remains pending actual
matching Guru consumer readiness. This legacy Task remains in_progress and
unmigrated; no whole-Issue Completion, source closure, archive or cleanup is claimed.

## Final revised candidate and fresh installed samples

The corrected CLI was rebuilt, repacked and installed with the unchanged local
Core in `/tmp/trellis-31-final-candidate-JQj4nW/installed`. Final tarballs are
under `/tmp/trellis-31-final-candidate-JQj4nW`; both remain version
`0.7.0-castbox.3`, schema 2.0 / API 1.0. Metadata/export/capability evidence
is in that directory's `candidate.json` and sample installations.

| Package | Final tarball SHA256 |
| --- | --- |
| Core | `66d7d0cad143ce01e83e54c0c09b91f3c9cf85949ea568ff18147372b3dd5d96` |
| CLI | `ba42c0d6579e00d43dd686a06f5c31686038769f4c31a29734806a37260efeee` |

The actual installed preflight refused a legacy Task directory alias and a
manual nonterminal Delivery under a PR-only target workflow; both preserved
the complete sampled file snapshot. This confirms the packaged fixes as well
as their source tests. No successful workflow replacement or business
migration was performed by these checks.

Fresh samples under the final candidate `samples/` got new Delivery identities
and actual Git commits. The independent carrier reread all candidate plans,
Checks and complete ranges, returning PASS without mutations. Its final actual
report is `research/installed-review-final.md`; the prior report remains
first-candidate evidence and was not rebound to the new IDs.

| Sample / slice | Exact final identity/outcome |
| --- | --- |
| Git-free single | Delivery `95a49e59-37e0-4dbd-9b0d-fe427375f071`; retained report1 bytes; delivered |
| Git two-slice AC1 | Delivery `05e167d7-0122-4986-8aa3-9896eb213a41`; complete range `033038a29bdce3401f3952371a00e2fd50773110..7893c3e4762a66c25062582a43a63ce0d6c2d3c0`; delivered commit `7893c3e4762a66c25062582a43a63ce0d6c2d3c0` |
| Git two-slice AC2 | Delivery `c7449f87-bc14-4fef-9938-21d774883bf1`; complete range `7893c3e4762a66c25062582a43a63ce0d6c2d3c0..3688a5ce141cd2f8b5b1bedd6f58d69056e8b568`; delivered commit `3688a5ce141cd2f8b5b1bedd6f58d69056e8b568` |

The parent freshly accepted readiness and whole sample scope from the new exact
results, using the same explicit artifact requirements and profile conditions.
The executor restored each exact reviewed HEAD before local results. All three
slices completed four actual gates, profile facts and no-write identical delivery
retries. Each sample Task has separate Completion and no-mutation Closure;
retained artifact hashes and absence of legacy root fields were rechecked.
Installed workflow/document/all Python scripts again matched current sources.

Final prepare/finish logs are `/tmp/trellis-31-final-samples-reprepare.log` and
`/tmp/trellis-31-final-samples-refinish.log`. These are controlled validation
repositories, not this Issue's completed Task. No source formal full Review
for a committed repository candidate, actual Guru integration, remote delivery
or release validation is inferred from the sample Review.

Final pre-commit workspace inventory: HEAD remains
`5c760463680ffc10a3f26957b330c57a4b0c3ff8` on
`codex/31-native-delivery-lifecycle`; no staged paths, external Task/workflow
changes or gitlink changes. Existing worktrees retain their refs, including
pre-existing prunable entries. No cleanup ran.

The user subsequently approved the exact 195-path local commit plan on
2026-10-12. Git history records that work commit; this approval does not extend
to remote candidate delivery, D2 cutover or whole-Task closeout.
