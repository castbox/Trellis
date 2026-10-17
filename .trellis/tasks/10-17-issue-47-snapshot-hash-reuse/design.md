# Design

## Boundary and owner

Add GitCandidateContent(root: Path, *, no_lazy_fetch: bool = False) to common/delivery_store.py, the existing public digest owner. Provide context-manager lifecycle, close(), and content_ref(exact_commit: str, paths: list[str]) -> str. Fix and resolve root for the context. Accept only a full actual commit OID, respecting the repository SHA1/SHA256 width. Reject refs, abbreviations and tag/blob objects.

Keep candidate_content_ref(root, paths, kind) compatible. Ordinary Path values remain mutable. Never infer immutability from their origin or inode.

## Facts and validation

Every input validates nonempty unique relative paths, private/reserved exclusions, exact commit identity, literal tree entries, regular-file mode/type and blob availability. Missing entries use the existing deletion tuple. Caller expected-result comparisons remain independent.

Use existing git_objects bounded helpers. Cache only reduced immutable content facts and optionally identical aggregate serialization within this actual-root operation. Read/hash new blobs once. Check availability/type for cached blobs. Use the original serialization algorithm; prefer a small internal shared routine over a second digest algorithm. Do not broaden unrelated verifier behavior.

Sanitize inherited GIT_* variables. Apply explicit GIT_NO_LAZY_FETCH=1 when requested. Support bare scratch repositories. Closing clears facts and prevents later use. Temporary batch files close on errors. Metadata may scale with path/blob count; whole content batches must not remain resident.

## Consumer migration

The installed Python module exposes the additive class. Existing API 1.0 shapes remain compatible. A capability check may select the class; old fallback is compatible but cannot count as optimized evidence.

An isolated pinned Guru prototype replaces snapshot + filesystem digest in manual_recovery.commit_candidate with the public reader. Standalone recovery owns its context. HistoryContext owns one reader per query, closing/recreating it when prepare switches to scratch. Pass no_lazy_fetch=True and preserve preparation/probe behavior, candidate shape and independent fact comparisons. Do not change production Guru files.

## Files and evidence

- Canonical packages/cli/src/templates/trellis/scripts/common/delivery_store.py and byte-identical dogfood: public capability.
- packages/cli/test/scripts/git-objects.integration.test.ts or focused adjacent suite: public semantics and old regressions.
- .trellis/spec/cli/backend/delivery-lifecycle.md: capability/lifecycle contract.
- Task research: pinned sources, isolated adaptation, frozen performance and installation/delivery evidence.
- Paired package version/lock metadata: new unused castbox prerelease; never move .3.

Baseline main is 0e3b23a3045357b76e69ca91e84b97b294dfb147. Hold production edits until before samples and numeric gates are frozen. Fix Git author/committer metadata, source refs, warmup and repetition conditions. Distinguish prototype adoption from downstream integration. Rollback selects previous source/packages; published bytes and archived evidence remain immutable.
