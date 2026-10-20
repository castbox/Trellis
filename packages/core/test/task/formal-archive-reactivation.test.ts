import { describe, expect, it } from "vitest";
import { emptyTaskRecord } from "../../src/task/schema.js";
import { emptyTaskRecordV2 } from "../../src/task/v2/operations.js";
import { validateFormalArchiveReactivationProjection } from "../../src/task/maintenance.js";

const reason = {
  locator: "requirements.md",
  revision: `sha256:${"a".repeat(64)}`,
};
const source = emptyTaskRecord({
  id: "formal",
  lifecycle_generation: 2,
  status: "completed",
  meta: { retained: true },
  children: ["child"],
});
const metadata = Object.fromEntries(
  Object.entries(source).filter(
    ([key]) => !["status", "commit", "pr_url", "completedAt"].includes(key),
  ),
);
const projection = emptyTaskRecordV2({
  ...metadata,
  id: "formal",
  lifecycle_generation: 3,
  accepted_scope: reason,
});
describe("formal predecessor projection", () => {
  it("increments exactly once while preserving identity, metadata, source and tree", () => {
    expect(
      validateFormalArchiveReactivationProjection(source, projection),
    ).toEqual(projection);
    expect(projection.deliveries).toEqual([]);
    expect(projection.completion_results).toEqual([]);
    expect(projection.closure_results).toEqual([]);
    for (const generation of [2, 4])
      expect(() =>
        validateFormalArchiveReactivationProjection(source, {
          ...projection,
          lifecycle_generation: generation,
        }),
      ).toThrow("exactly once");
  });
  it.each(["id", "source", "meta", "children", "artifact_origin"])(
    "preserves %s",
    (field) => {
      const value =
        field === "source"
          ? {
              kind: "issue",
              repo_ref: "example/repo",
              number: 1,
              disposition: "reference_only",
            }
          : field === "meta"
            ? {}
            : field === "children"
              ? []
              : "changed";
      expect(() =>
        validateFormalArchiveReactivationProjection(source, {
          ...projection,
          [field]: value,
        }),
      ).toThrow();
    },
  );
  it("requires canonical completed schema1, an incrementable generation and accepted scope", () => {
    expect(() =>
      validateFormalArchiveReactivationProjection(
        { ...source, status: "planning" },
        projection,
      ),
    ).toThrow("unsupported_source");
    expect(() =>
      validateFormalArchiveReactivationProjection(projection, projection),
    ).toThrow("unsupported_source");
    expect(() =>
      validateFormalArchiveReactivationProjection(
        { ...source, lifecycle_generation: Number.MAX_SAFE_INTEGER },
        projection,
      ),
    ).toThrow("exactly once");
    expect(() =>
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        accepted_scope: null,
      }),
    ).toThrow("accepted_scope_required");
  });
  it("does not manufacture predecessor Completion or an empty current Delivery", () => {
    expect(() =>
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        completion_results: [
          {
            result_id: "completion",
            owner_id: "owner",
            evidence: [reason],
            lifecycle_generation: 2,
            accepted_scope: reason,
            delivery_result_ids: [],
            outcome: "completed",
          },
        ],
      }),
    ).toThrow("formal_lifecycle_conflict");
    const delivery = {
      id: "11111111-1111-4111-8111-111111111111",
      lifecycle_generation: 2,
      scope_ref: { authority: reason, anchors: ["history"] },
      planning_root: "deliveries/11111111-1111-4111-8111-111111111111",
      profile: "manual",
      phase: "planning",
      plan_ref: null,
      candidate: null,
      results: {
        planning: null,
        check: null,
        full_review: null,
        readiness: null,
      },
      publication_result: null,
      delivery_result: null,
      stop_result: null,
    };
    expect(() =>
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        deliveries: [delivery],
      }),
    ).toThrow("historical_outcome_required");
    const historical = {
      ...delivery,
      phase: "delivered",
      delivery_result: {
        result_id: "old-delivery",
        owner_id: "original-owner",
        evidence: [reason],
        profile: "manual",
        artifact: reason,
        candidate: {
          kind: "git_free",
          content_ref: `sha256:${"a".repeat(64)}`,
          paths: ["artifact.txt"],
          head_ref: null,
          base_ref: null,
        },
      },
    };
    expect(
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        deliveries: [historical],
      }).deliveries,
    ).toEqual([historical]);
    expect(() =>
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        deliveries: [{ ...historical, lifecycle_generation: 3 }],
      }),
    ).toThrow("historical_outcome_required");
    const gate = {
      result_id: "old-gate",
      owner_role: "planning",
      owner_id: "owner",
      outcome: "accepted",
      scope_ref: delivery.scope_ref,
      plan_ref: reason,
      candidate: null,
      predecessor_result_id: null,
      obligations: [],
      evidence: [reason],
    };
    expect(() =>
      validateFormalArchiveReactivationProjection(source, {
        ...projection,
        deliveries: [
          { ...historical, results: { ...historical.results, planning: gate } },
        ],
      }),
    ).toThrow("inherited_gate_conflict");
  });
  it("requires original-owner attribution for actual legacy facts", () => {
    const old = { ...source, completedAt: "2026-10-01" };
    expect(() =>
      validateFormalArchiveReactivationProjection(old, projection),
    ).toThrow("legacy_fact_attribution_required");
    expect(
      validateFormalArchiveReactivationProjection(old, projection, [
        {
          field: "completedAt",
          disposition: "source_snapshot",
          reason,
          owner_id: "original-owner",
        },
      ]),
    ).toEqual(projection);
  });
});
