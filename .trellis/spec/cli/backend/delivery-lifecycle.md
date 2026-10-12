# Versioned Task / Delivery lifecycle

## Scope and authority

Issue #31 D1 introduces opt-in Task schema 2.0 / Delivery API 1.0. The shipped
public contract is `packages/cli/src/templates/trellis/delivery-contract.md`;
that document owns the lifecycle, ownership, result and recovery semantics.
Do not duplicate the transition table in platform hooks or route code.

Legacy `/task` and default legacy installs retain their existing contract until
reviewed D2 migration/cutover. The older task-lifecycle and workflow-state specs
describe that compatibility path. A Task must never receive both legacy status
and Delivery phase writes. Default retirement awaits actual matching consumer
and migration evidence; the presence of schema-2 code is insufficient.

First-install onboarding under the exact bundled `native-delivery-v1` workflow
creates its explicit guideline scope and a `manual` Delivery before Planning;
it records no Planning or subsequent gate approval. A custom schema-2 workflow
creates a Task only, with no accepted scope or Delivery. Its declared owners
choose those semantics; init must not select the first supported profile.

Workflow replacement preflight inspects supported direct Task-directory aliases
through the same containment and actual-directory checks as ordinary Task roots.
It rejects incompatible schema or unsupported nonterminal Delivery profiles
before writes. Delivered/stopped history remains eligible for owner recovery.

## Interfaces

- SDK: `@mindfoldhq/trellis-core/task/v2` only; keep the root and legacy Task
  exports stable during D1.
- Python: shipped `delivery.py` and common deterministic record module. Resolve
  the active workflow contract before formal writes; declare exact owner roles.
- Session: schema 3 has exact TaskId/generation plus explicit nullable Delivery
  identity. Keep registered-worktree resolution, identity reservations and
  selected-record strict validation. Read-only consumers never repair binding.
- Candidate/result APIs must use the same JSON shape and behavior in TS/Python.
  Shared fixture corpus belongs to Core; CLI owns executable integration and
  install/context/argv verification.

## Validation and error cases

| Case | Required behavior |
| --- | --- |
| Missing/duplicate owner or API mismatch | Explicit contract error; no native fallback. |
| No Delivery selection | `no_current_delivery`; no sole-item inference. |
| Stale or ambiguous Task/Delivery selection | Concrete error, distinct from no Task. |
| Check pass | Record only Check; independent full Review still required. |
| Identical same-result retry | Read back identical result; no rewrite. |
| Changed content under retained result ID | `result_identity_conflict`; a revised formal gate uses a new producer ID. |
| Stale raw preimage or immutable identity change | Reject before replacement. |
| Actual success with missing/obsolete gates | Original owner records historical success; no fabricated gates or repeated remote action. |
| Archive without current Completion/Closure | Reject; archive must not create completed facts. |

## Required evidence

Meaningful tests cover transitions, rework, stop, result identity/applicability,
clean candidates, historical-success recovery, completion/closure/reopen,
explicit session selection and cross-runtime parity. Native installed samples
must exercise both Git and Git-free profiles and two slices of one Task.
Use controlled temporary installations; do not migrate dogfood or business
Task records merely to satisfy tests. Template and dogfood script twins stay
synchronized while the repository itself may remain on its legacy workflow.

Candidate hashing excludes lifecycle/session/private-result files; writing a
result must not invalidate the content it describes. Owner-selected business
docs and tests remain part of the intended candidate. Runtime validates
objective facts and containment; AI owners decide sufficiency and earliest
affected stage. A read-only Review carrier cannot self-fix.

Current gate slots do not retain cleared/replaced gate identity history. The
producer must allocate a new ID for a revised invocation and cannot reinterpret
an absent old gate as pass. Collision detection covers retained results;
immutable Delivery/Completion/Closure history remains recoverable. Do not add
a ledger merely to retain every historical Check retry.

Guru installed/private migration evidence, external marketplace workflow
changes and the release matrix are separate owner boundaries. Report tests,
controlled installation evidence, remote integration and release evidence
independently. Missing joint evidence never becomes a PASS.

## Rework publication and carrier regressions

The public contract's "Publication refresh after rework" section owns the
`recordPublicationFact` / `record-publication` signature, identity constraints,
normal/historical error matrix and examples. Keep prior PR publication during
rework; replace the undelivered current slot only with a new producer ID for the
same PR/owner and verified actual facts. Targets can change with fresh applicable
obligations. Delivered facts remain immutable. Shared `publication-rework.json`
and real-store regressions must cover P2 success with lost gates/output and
reject stale P1 without remote mutation. No retired publication ledger is added.

Schema-2 subagent context requires exact session identity. If strict Delivery
resolution returns `no_current_task` after legacy Task fallback found a v2
record, stop instead of reading root PRD/manifests. Legacy sole-session fallback
remains compatible. Regressions assert no root sentinel or selected-Delivery
sentinel leaks on the missing-identity path, and explicit identity loads the
selected slice. Actual Droid carriers under `droid/droids/` must have the same
exact-selection and read-only `delivery_review` guards as other agent carriers;
registry tests inspect the collector's real files, not only skill availability.

## Scenario: exact Git facts, permission modes and context roots

### 1. Scope / Trigger

D1 post-merge review exposed mutable historical commit refs, inherited Git
repository redirects and incompatible workspace/Git-tree permission hashing.
OpenCode also rejected already accepted storage-root aliases. These corrections
change objective verification, not semantic ownership or D2 migration.

### 2. Signatures

- `computeCandidateContentRef(root, paths, kind?: CandidateRef["kind"]): string`.
- `candidate_content_ref(root, paths, kind: str | None = None) -> str`.
- `delivery.py candidate --paths <paths...> [--kind git|git_free]`.
- Existing `record_delivery` input/output and lifecycle edges remain unchanged.

### 3. Contracts

The public contract owns hash serialization: Git mode normalizes owner execute
bit to 0644/0755; git_free keeps all 0777 permissions. Explicit recorded kind
controls verification. Two-argument computation infers Git-worktree membership;
manual artifacts in a Git root can explicitly request git_free. All verifier
Git subprocesses strip inherited GIT_* values, including binary reads.
local_commit.commit is a complete lowercase 40/64-hex OID matching candidate
head; the store requires a commit object whose resolved full OID exactly
matches the input, so a 40-hex prefix in a SHA-256 repository is rejected.

OpenCode may consume the real Task root returned by the strict active resolver.
Delivery context is exactly that Task's deliveries/UUID descendant. The
validated .trellis/tasks/selected-Task root alias remains valid; every nested
Delivery component must be a directory without a symlink. Unvalidated hints
cannot create another trusted root or override exact selection.

### 4. Validation & Error Matrix

| Input | Required result |
| --- | --- |
| local_commit HEAD/branch/tag-name/short SHA | invalid_record before write |
| SHA-256 repository receives a 40-hex commit prefix | invalid_git_fact; no write |
| Full OID points to blob/tag/nonexistent object | invalid_git_fact; no stored fact |
| Exact commit tree differs from selected content | candidate_mismatch |
| Git file permissions 0600/0640, regular committed file | Same normalized mode as 100644; normal/historical delivery may verify |
| Owner execute bit changes | Different Git content ref; old candidate rejected |
| git_free permission change | Different content ref; old candidate rejected |
| Inherited Git redirect selects another repo | Ignore redirect; verify supplied root |
| Legal validated storage-root alias | Inject exact selected Delivery plans/manifests |
| Nested deliveries/UUID symlink or stale selection | Fail closed; no Task-root fallback |

### 5. Good/Base/Bad Cases

Good: historical exact commit survives current HEAD movement. Base: ordinary
0644 Git candidates keep their digest. Bad: persist HEAD as a terminal fact,
hash a Git regular file's private 0600 permissions as a Git tree mode, or let
another repository's GIT_DIR supply the candidate HEAD.

### 6. Tests Required

Use two real controlled Git repositories for environment pollution, covering
HEAD validation and binary historical blob reads. Verify branch/tag/HEAD/short
ref rejection plus exact-commit recovery and non-commit OID rejection in both
runtimes, including a real SHA-256 repository rejecting a 40-hex prefix with
unchanged record bytes. Cover 0600, 0640 and executable modes, explicit git_free in a Git
root, permission drift, and hash parity. Run actual OpenCode injection through
validated root aliases and nested-symlink rejection with zero-write snapshots.
Workflow ownership regressions live in commands-workflow: custom legacy/v2
forced and add-platform reinit followed by normal/forced update.

### 7. Wrong vs Correct

Wrong: compute a manual git_free hash with automatic Git normalization or rely
on cwd while passing inherited repository-redirect environment to Git.
Correct: verify with candidate.kind, and invoke Git in the validated root with
clean repository environment; store immutable commit OIDs only.
