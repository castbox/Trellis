import { describe, expect, it } from "vitest";
import { emptyTaskRecord } from "../../src/task/schema.js";
import { emptyTaskRecordV2 } from "../../src/task/v2/operations.js";
import { classifyMaintenanceTask, classifySessionCarrier, classifyBranchBinding, validateSelectedTaskProjection } from "../../src/task/maintenance.js";

describe("selected maintenance domain boundary", () => {
  const old = emptyTaskRecord({ id: "selected", lifecycle_generation: 2, completedAt: "2026-09-01", commit: "old-commit", status: "completed" });
  const projection = emptyTaskRecordV2(Object.fromEntries(Object.entries(old).filter(([key]) => !["status", "commit", "pr_url", "completedAt"].includes(key))) as Parameters<typeof emptyTaskRecordV2>[0]);
  it("positively separates predecessor/current formats without permissive fallback", () => {
    expect(classifyMaintenanceTask(old)).toEqual({ kind: "schema1", task_id: "selected", generation: 2 });
    expect(classifyMaintenanceTask({ id: "old", name: "old", title: "old", status: "planning", creator: "owner", assignee: "owner" })).toEqual({ kind: "legacy", task_id: "old", generation: 0 });
    expect(classifyMaintenanceTask(projection).kind).toBe("schema2");
    expect(() => classifyMaintenanceTask({ ...old, lifecycle_generation: undefined })).toThrow("unsupported_source");
    expect(() => classifyMaintenanceTask({ ...old, schema_version: "1.0" })).toThrow("unsupported_source");
  });
  it("requires explicit old fact attribution and preserves dates without fabricating results", () => {
    expect(() => validateSelectedTaskProjection(old, projection)).toThrow("legacy_fact_attribution_required");
    const reason = { locator: "history.md", revision: "original-owner" };
    const record = validateSelectedTaskProjection(old, projection, [
      { field: "commit", disposition: "source_snapshot", owner_id: "original-owner", reason },
      { field: "completedAt", disposition: "source_snapshot", owner_id: "original-owner", reason },
    ]);
    expect(record.deliveries).toEqual([]);
    expect(record.completion_results).toEqual([]);
    expect(() => validateSelectedTaskProjection(old, projection, [
      { field: "commit", disposition: "source_snapshot", owner_id: "original-owner", reason },
      { field: "completedAt", disposition: "delivery_result", reason, owner_id: "owner", result_id: "missing" },
    ])).toThrow("timestamp");
  });
  it("recognizes the original 0.6 local writer metadata without treating it as current authority", () => {
    const selected = { task_id: "selected", generation: 0, task_path: "/owner/.trellis/tasks/selected", carrier_workspace: "/owner" };
    const actualWriter = { platform: "codex", last_seen_at: "2026-10-15T09:58:29Z", current_task: ".trellis/tasks/selected", current_run: null };
    expect(classifySessionCarrier(actualWriter, selected)).toEqual({ kind: "path0", matches: true });
    expect(classifySessionCarrier({ ...actualWriter, sessionId: "original-session", transcript_path: "/platform/transcript" }, selected)).toEqual({ kind: "path0", matches: true });
    expect(classifySessionCarrier({ ...actualWriter, current_task: ".trellis/tasks/other" }, selected).matches).toBe(false);
    expect(() => classifySessionCarrier({ ...actualWriter, last_seen_at: null }, selected)).toThrow("unsupported_carrier");
  });
  it("attributes identity and old path carriers to the exact owner and generation", () => {
    const selected = { task_id: "selected", generation: 2, task_path: "/owner/.trellis/tasks/selected", carrier_workspace: "/peer", common_dir: "/common" };
    expect(classifySessionCarrier({ schema_version: 2, task_id: "selected", lifecycle_generation: 1 }, selected).matches).toBe(false);
    expect(classifySessionCarrier({ current_task: ".trellis/tasks/selected" }, selected).matches).toBe(false);
    expect(classifySessionCarrier({ schema_version: 1, current_task: ".trellis/tasks/selected", repository_common_dir: "/common", task_workspace_root: "/owner" }, selected)).toEqual({ kind: "path1", matches: true });
    expect(classifySessionCarrier({ schema_version: 3, task_id: "selected", lifecycle_generation: 2, delivery_id: null }, selected).matches).toBe(true);
    expect(() => classifySessionCarrier({ current_task: "selected" }, selected)).toThrow("unsupported_carrier");
    expect(classifyBranchBinding({ schema_version: "1.0", task_id: "selected", lifecycle_generation: 1, binding_revision: 0, branch_name: "task" }, selected).matches).toBe(false);
  });
  it("recognizes the native schema-1 writer and retains exact path ownership", () => {
    const selected = { task_id: "selected", generation: 0, task_path: "/owner/.trellis/tasks/selected", common_dir: "/common" };
    // 43fffc17 active_task.py set_active_task: metadata + schema-1 path identity.
    const writer = { platform: "codex", last_seen_at: "2026-10-15T09:58:29Z", schema_version: 1, repository_common_dir: "/common", task_workspace_root: "/owner", current_task: ".trellis/tasks/selected", current_run: null };
    expect(classifySessionCarrier(writer, selected)).toEqual({ kind: "path1", matches: true });
    for (const alias of ["session_id", "sessionId", "sessionID", "conversation_id", "conversationId", "conversationID", "transcript_path", "transcriptPath", "transcript"]) {
      expect(classifySessionCarrier({ ...writer, [alias]: "original-context" }, selected)).toEqual({ kind: "path1", matches: true });
      expect(() => classifySessionCarrier({ ...writer, [alias]: "" }, selected)).toThrow("unsupported_carrier");
    }
    for (const change of [{ current_task: ".trellis/tasks/other" }, { task_workspace_root: "/peer" }, { repository_common_dir: "/different" }]) {
      expect(classifySessionCarrier({ ...writer, ...change }, selected)).toEqual({ kind: "path1", matches: false });
    }
    for (const change of [{ platform: "" }, { last_seen_at: null }, { current_run: {} }, { arbitrary: "unknown" }]) {
      expect(() => classifySessionCarrier({ ...writer, ...change }, selected)).toThrow("unsupported_carrier");
    }
    for (const missing of ["platform", "last_seen_at", "current_run"]) {
      const partial = Object.fromEntries(Object.entries(writer).filter(([key]) => key !== missing));
      expect(() => classifySessionCarrier(partial, selected)).toThrow("unsupported_carrier");
    }
  });
});
