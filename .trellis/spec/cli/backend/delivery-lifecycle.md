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
