import { isDeepStrictEqual } from "node:util";
import { isPlainObject } from "./schema.js";
import { parseTaskRecordV2 } from "./v2/schema.js";
import type { TaskRecordV2 } from "./v2/types.js";
import { getGateApplicability } from "./v2/operations.js";

/** Reviewed projection only: legacy status cannot synthesize lifecycle facts. */
export function validateTaskV2Projection(
  source: unknown,
  projection: unknown,
): TaskRecordV2 {
  if (!isPlainObject(source))
    throw new Error("Migration source must be an object");
  const record = parseTaskRecordV2(projection);
  if (!isDeepStrictEqual(source.artifact_origin, record.artifact_origin))
    throw new Error(
      "Migration cannot initialize or change artifact_origin; explicit relocation owns it",
    );
  for (const field of [
    "id",
    "name",
    "title",
    "description",
    "dev_type",
    "scope",
    "package",
    "priority",
    "createdAt",
    "base_branch",
    "branch",
    "worktree_path",
    "parent",
    "relatedFiles",
    "notes",
    "meta",
    "source",
  ] as const) {
    if (field in source && !isDeepStrictEqual(source[field], record[field])) {
      throw new Error(`Migration must preserve task.${field}`);
    }
  }
  if (record.lifecycle_generation !== (source.lifecycle_generation ?? 0))
    throw new Error("Migration must preserve lifecycle_generation");
  for (const field of ["children", "subtasks"] as const) {
    if (!(field in source)) continue;
    const values = source[field];
    if (
      !Array.isArray(values) ||
      values.some(
        (value: unknown) =>
          typeof value !== "string" || !record.children.includes(value),
      )
    )
      throw new Error(`Migration requires lossless task.${field}`);
  }
  if ("children" in source || "subtasks" in source) {
    const relations = [
      ...(Array.isArray(source.children) ? (source.children as string[]) : []),
    ];
    for (const child of Array.isArray(source.subtasks)
      ? (source.subtasks as string[])
      : [])
      if (!relations.includes(child)) relations.push(child);
    if (!isDeepStrictEqual(relations, record.children))
      throw new Error("Migration must preserve the exact task tree");
  }
  for (const delivery of record.deliveries) {
    if (
      delivery.lifecycle_generation !== record.lifecycle_generation ||
      ["planning", "delivered", "stopped"].includes(delivery.phase)
    )
      continue;
    const gates = getGateApplicability(record, {
      task_id: record.id,
      lifecycle_generation: record.lifecycle_generation,
      delivery_id: delivery.id,
    });
    const roles =
      delivery.phase === "publishing"
        ? (["planning", "check", "full_review", "readiness"] as const)
        : delivery.phase === "reviewing"
          ? (["planning", "check"] as const)
          : (["planning"] as const);
    for (const role of roles)
      if (gates[role].kind !== "applicable")
        throw new Error(`Migration cannot activate stale ${role} gate`);
  }
  // Historical outcomes are supplied by their producers, never reconstructed
  // by this validator. The executor preserves the entire raw source separately.
  return record;
}
