/** Explicit maintenance boundary; never used by current lifecycle writers. */
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isKnownLegacyTaskRecord } from "./migration.js";
import { isPlainObject, taskRecordSchema } from "./schema.js";
import { validateTaskV2Projection } from "./migration-v2.js";
import { parseTaskRecordV2 } from "./v2/schema.js";
import type { AuthorityRef, TaskRecordV2 } from "./v2/types.js";

export class MaintenanceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "MaintenanceError";
  }
}
export interface MaintenanceTaskIdentity { task_id: string; generation: number }
export function classifyMaintenanceTask(value: unknown): MaintenanceTaskIdentity & { kind: "legacy" | "schema1" | "schema2" } {
  if (isPlainObject(value) && value.schema_version === "2.0") {
    const record = parseTaskRecordV2(value);
    return { kind: "schema2", task_id: record.id, generation: record.lifecycle_generation };
  }
  const current = taskRecordSchema.safeParse(value);
  if (current.success) return { kind: "schema1", task_id: current.data.id, generation: current.data.lifecycle_generation };
  if (isKnownLegacyTaskRecord(value)) return { kind: "legacy", task_id: (value as Record<string, string>).id, generation: 0 };
  throw new MaintenanceError("unsupported_source", "Task is neither a known legacy record nor a canonical schema1/schema2 record");
}
export type LegacyFactDisposition = {
  field: "commit" | "pr_url" | "completedAt";
  reason: AuthorityRef;
  owner_id: string;
} & ({ disposition: "source_snapshot" } | { disposition: "delivery_result"; result_id: string; owner_id: string });

/** Original owners supply attribution; dates/status never imply v2 success. */
export function validateSelectedTaskProjection(source: unknown, projection: unknown, facts: readonly LegacyFactDisposition[] = []): TaskRecordV2 {
  const classification = classifyMaintenanceTask(source);
  if (classification.kind === "schema2") throw new MaintenanceError("already_current", "Task conversion requires a predecessor");
  const old = source as Record<string, unknown>;
  const record = validateTaskV2Projection(source, projection);
  const fields = ["commit", "pr_url", "completedAt"].filter(field => old[field] !== undefined && old[field] !== null && old[field] !== "");
  if (!isDeepStrictEqual(fields.sort(), facts.map(f => f.field).sort())) throw new MaintenanceError("legacy_fact_attribution_required", "Unresolved legacy fact attribution: every retained fact needs exactly one disposition");
  for (const fact of facts) {
    if (!fact.owner_id || !fact.reason.locator || !fact.reason.revision) throw new MaintenanceError("invalid_fact_reason", fact.field);
    if (fact.disposition === "source_snapshot") continue;
    if (fact.field === "completedAt") throw new MaintenanceError("invalid_fact_attribution", "completedAt has no v2 timestamp equivalent; retain it in the raw source snapshot");
    const outcome = record.deliveries.flatMap(d => [d.delivery_result, d.publication_result]).find(r => r?.result_id === fact.result_id);
    if (!outcome || outcome.owner_id !== fact.owner_id) throw new MaintenanceError("legacy_result_mismatch", `Legacy result owner/identity mismatch ${fact.field}`);
    const actual = fact.field === "commit"
      ? outcome.profile === "local_commit" ? outcome.commit : outcome.profile === "pull_request" && "merge_commit" in outcome ? outcome.merge_commit : null
      : outcome.profile === "pull_request" ? `https://github.com/${outcome.repo_ref}/pull/${outcome.pr_number}` : null;
    if (actual !== old[fact.field]) throw new MaintenanceError("legacy_result_mismatch", fact.field);
  }
  return record;
}
function exact(value: Record<string, unknown>, keys: string[]): boolean {
  return isDeepStrictEqual(Object.keys(value).sort(), keys.sort());
}
const taskId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v);
const generation = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const legacySessionMetadata = ["session_id", "sessionId", "sessionID", "conversation_id", "conversationId", "conversationID", "transcript_path", "transcriptPath", "transcript"];
function unversionedLocalCarrier(value: Record<string, unknown>): boolean {
  if (exact(value, ["current_task"])) return true;
  const required = ["platform", "last_seen_at", "current_task", "current_run"];
  const allowed = new Set([...required, ...legacySessionMetadata]);
  // The 0.6 set_active_task writer adds context metadata and a null run slot.
  // These fields identify a predecessor carrier; none grant current authority.
  return required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => allowed.has(key))
    && value.current_run === null
    && ["platform", "last_seen_at", ...legacySessionMetadata.filter(key => Object.hasOwn(value, key))]
      .every(key => typeof value[key] === "string" && value[key] !== "");
}
export interface CarrierSelection extends MaintenanceTaskIdentity { task_path: string; carrier_workspace?: string; common_dir?: string | null }
export function classifySessionCarrier(value: unknown, selected: CarrierSelection): { kind: "identity2" | "identity3" | "path1" | "path0"; matches: boolean } {
  if (!isPlainObject(value)) throw new MaintenanceError("unsupported_carrier", "Session must be an object");
  if (value.schema_version === 2 || value.schema_version === 3) {
    const version = value.schema_version;
    if (!exact(value, ["schema_version", "task_id", "lifecycle_generation", ...(version === 3 ? ["delivery_id"] : [])]) || !taskId(value.task_id) || !generation(value.lifecycle_generation) || (version === 3 && value.delivery_id !== null && (typeof value.delivery_id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value.delivery_id)))) throw new MaintenanceError("unsupported_carrier", "Malformed identity session");
    return { kind: version === 2 ? "identity2" : "identity3", matches: value.task_id === selected.task_id && value.lifecycle_generation === selected.generation };
  }
  const old = value.schema_version === 1;
  const keys = old ? ["schema_version", "repository_common_dir", "task_workspace_root", "current_task"] : ["current_task"];
  if (!(old ? exact(value, keys) : unversionedLocalCarrier(value)) || typeof value.current_task !== "string" || !value.current_task.startsWith(".trellis/tasks/") || value.current_task.split("/").length !== 3) throw new MaintenanceError("unsupported_carrier", "Unknown path-based session");
  const workspace = old ? value.task_workspace_root : selected.carrier_workspace;
  if (typeof workspace !== "string" || !path.isAbsolute(workspace) || (old && (typeof value.repository_common_dir !== "string" || !path.isAbsolute(value.repository_common_dir)))) throw new MaintenanceError("unsupported_carrier", "Path carrier requires its original absolute workspace/common storage");
  return { kind: old ? "path1" : "path0", matches: path.resolve(workspace, value.current_task) === path.resolve(selected.task_path) && (!old || path.resolve(String(value.repository_common_dir)) === selected.common_dir) };
}
export function classifyBranchBinding(value: unknown, selected: MaintenanceTaskIdentity): { matches: boolean; branch_name: string; binding_revision: number } {
  if (!isPlainObject(value) || !exact(value, ["schema_version", "task_id", "lifecycle_generation", "binding_revision", "branch_name"]) || value.schema_version !== "1.0" || !taskId(value.task_id) || !generation(value.lifecycle_generation) || !generation(value.binding_revision) || typeof value.branch_name !== "string" || !value.branch_name) throw new MaintenanceError("unsupported_binding", "Expected a canonical schema1 branch binding");
  return { matches: value.task_id === selected.task_id && value.lifecycle_generation === selected.generation, branch_name: value.branch_name, binding_revision: Number(value.binding_revision) };
}
