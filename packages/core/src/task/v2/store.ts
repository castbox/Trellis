import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { applyTaskOperation, canonicalJson, parseTaskOperation, same } from "./operations.js";
import { candidate, fail, parseTaskRecordV2, relativePath } from "./schema.js";
import type { AuthorityRef, CandidateRef, DeliveryFact, OperationOutput, PublicationFact, TaskRecordV2, WorkflowContract } from "./types.js";

export interface TaskStoreOptions { root: string; taskDir: string }
export interface WriteTaskV2Options extends TaskStoreOptions { record: TaskRecordV2; expected_preimage?: string | null }
export interface ApplyTaskV2Options extends TaskStoreOptions {
  operation: unknown;
  workflow: WorkflowContract;
  expected_preimage: string;
  /** Original producer's read-only objective verification for PR/external historical facts. No remote mutation. */
  verifyFact?: (fact: DeliveryFact | PublicationFact) => boolean;
}
function digest(bytes: string | Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function contained(root: string, locator: string, mayNotExist = false, ownedTaskRoots = true): string {
  relativePath(locator); const base = fs.realpathSync(root); const target = path.resolve(base, locator);
  if (!target.startsWith(base + path.sep)) fail("invalid_locator", locator);
  // Validate every existing component; do not follow nested symlinks at write/read boundaries.
  let current = base;
  const parts = locator.split("/");
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    let stat: fs.Stats;
    try { stat = fs.lstatSync(current); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT" && mayNotExist) break; fail("missing_locator", locator); }
    if (stat.isSymbolicLink()) {
      // Preserve established user-selected .trellis/tasks/direct-task roots.
      // Files and nested archive/planning components never become root aliases.
      const ownedRoot = ownedTaskRoots && parts[0] === ".trellis" &&
        (index === 0 || (parts[1] === "tasks" && (index === 1 || (index === 2 && part !== "archive"))));
      if (!ownedRoot) fail("invalid_locator", `symlink ${locator}`);
      try { if (!fs.statSync(fs.realpathSync(current)).isDirectory()) fail("invalid_locator", `not a root directory: ${locator}`); }
      catch { fail("invalid_locator", `dangling root alias ${locator}`); }
    }
  }
  return target;
}
function recordPath(options: TaskStoreOptions, mayNotExist = false): string {
  const taskDir = path.isAbsolute(options.taskDir) ? path.relative(fs.realpathSync(options.root), options.taskDir).split(path.sep).join("/") : options.taskDir;
  if (taskDir === ".trellis/tasks/archive" || !/^\.trellis\/tasks\/(?:archive\/[^/]+\/)?[^/]+$/.test(taskDir)) fail("invalid_locator", "taskDir must be a managed task directory");
  return contained(options.root, `${taskDir}/task.json`, mayNotExist, true);
}
export function serializeTaskRecordV2(input: unknown): string { return JSON.stringify(parseTaskRecordV2(input), null, 2) + "\n"; }
export function loadTaskRecordV2(options: TaskStoreOptions): { record: TaskRecordV2; preimage: string } {
  const preimage = fs.readFileSync(recordPath(options), "utf8"); return { record: parseTaskRecordV2(JSON.parse(preimage)), preimage };
}
function writeAtomic(file: string, bytes: string, mode?: number): void {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`);
  try { fs.writeFileSync(temporary, bytes, { flag: "wx", mode: mode ?? 0o600 }); fs.renameSync(temporary, file); }
  catch (error) { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); throw error; }
}
function assertIdentities(previous: TaskRecordV2, next: TaskRecordV2): void {
  if (previous.id !== next.id || !same(previous.source, next.source)) fail("immutable_identity", "Task id/source cannot change");
  for (const d of previous.deliveries) {
    const updated = next.deliveries.find((item) => item.id === d.id);
    if (updated?.lifecycle_generation !== d.lifecycle_generation || updated.planning_root !== d.planning_root || updated.profile !== d.profile) fail("immutable_identity", d.id);
    if (d.delivery_result && !same(d.delivery_result, updated.delivery_result)) fail("immutable_delivery_fact", d.id);
    if (d.stop_result && !same(d.stop_result, updated.stop_result)) fail("immutable_delivery_fact", d.id);
  }
  for (const r of previous.completion_results) if (!next.completion_results.some((item) => same(item, r))) fail("immutable_completion_fact", r.result_id);
  for (const r of previous.closure_results) if (!next.closure_results.some((item) => same(item, r))) fail("immutable_closure_fact", r.result_id);
}
/** Initial creation or metadata-only write. Lifecycle changes must use applyTaskOperationToStore. */
export function writeTaskRecordV2(options: WriteTaskV2Options): void {
  const next = parseTaskRecordV2(options.record); const file = recordPath(options, true);
  let mode: number | undefined;
  if (fs.existsSync(file)) {
    const { record: previous, preimage } = loadTaskRecordV2(options);
    if (options.expected_preimage !== preimage) fail("stale_preimage", "exact previous task bytes required");
    assertIdentities(previous, next);
    for (const field of ["lifecycle_generation", "accepted_scope", "deliveries", "completion_results", "closure_results"] as const) if (!same(previous[field], next[field])) fail("closed_operation_required", field);
    mode = fs.statSync(file).mode & 0o777;
  } else {
    if (options.expected_preimage !== undefined && options.expected_preimage !== null) fail("stale_preimage", "Task does not exist");
    if (next.lifecycle_generation !== 0 || next.deliveries.length || next.completion_results.length || next.closure_results.length || next.accepted_scope !== null) fail("closed_operation_required", "new Task must have empty lifecycle");
    reserveIdentity(options, next.id);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true }); writeAtomic(file, serializeTaskRecordV2(next), mode);
}
/** Identity reservation is intentionally a narrow read, not acceptance of old lifecycle metadata. */
function reserveIdentity(options: TaskStoreOptions, id: string): void {
  const tasks = contained(options.root, ".trellis/tasks", true, true); if (!fs.existsSync(tasks)) return;
  const inspect = (dir: string, historical = false): void => {
    contained(options.root, path.relative(fs.realpathSync(options.root), dir).split(path.sep).join("/"), false, true);
    const visibleCollision = (): void => {
      const name = path.basename(dir); const candidates = [name, name.replace(/^\d+-\d+-/, "")];
      if (candidates.some((value) => value.toLowerCase() === id.toLowerCase())) fail("task_id_collision", dir);
    };
    const file = path.join(dir, "task.json");
    let stat: fs.Stats;
    try { stat = fs.lstatSync(file); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { visibleCollision(); return; } throw error; }
    if (stat.isSymbolicLink()) fail("invalid_locator", "symlink task record");
    let parsed: unknown;
    try { parsed = JSON.parse(fs.readFileSync(file, "utf8")); } catch { if (historical) { visibleCollision(); return; } fail("invalid_identity_reservation", file); }
    if (typeof parsed !== "object" || parsed === null || !("id" in parsed) || typeof parsed.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(parsed.id)) { if (historical) { visibleCollision(); return; } fail("invalid_identity_reservation", file); }
    if (parsed.id.toLowerCase() === id.toLowerCase()) fail("task_id_collision", file);
  };
  for (const entry of fs.readdirSync(tasks, { withFileTypes: true })) {
    if (entry.name === "archive") {
      const archive = contained(options.root, ".trellis/tasks/archive", false, true);
      for (const month of fs.readdirSync(archive, { withFileTypes: true })) if (month.isDirectory() || month.isSymbolicLink()) {
        const monthDir = contained(options.root, `.trellis/tasks/archive/${month.name}`, false, true);
        for (const task of fs.readdirSync(monthDir, { withFileTypes: true })) if (task.isDirectory() || task.isSymbolicLink()) inspect(path.join(monthDir, task.name), true);
      }
    } else if (entry.isDirectory() || entry.isSymbolicLink()) inspect(path.join(tasks, entry.name));
  }
}
function reservedCandidatePath(locator: string): boolean {
  return locator === ".git" || locator.startsWith(".git/") || /(?:^|\/)trellis\/sessions(?:\/|$)/.test(locator) || /^\.trellis\/(?:sessions|\.runtime|\.internal|\.delivery-results)(?:\/|$)/.test(locator) || /^\.trellis\/tasks\/(?:archive\/[^/]+\/)?[^/]+\/task\.json$/.test(locator);
}
/** Git fingerprints retain Git's executable bit; Git-free fingerprints retain full file permissions. */
export function computeCandidateContentRef(root: string, paths: string[], kind?: CandidateRef["kind"]): string {
  const entries: [string, number | null, string | null][] = [];
  if (!paths.length || new Set(paths).size !== paths.length) fail("invalid_candidate", "nonempty unique paths required");
  if (kind === undefined) { try { kind = git(root, ["rev-parse", "--is-inside-work-tree"]) === "true" ? "git" : "git_free"; } catch { kind = "git_free"; } }
  if (kind !== "git" && kind !== "git_free") fail("invalid_candidate", "kind must be git or git_free");
  for (const locator of [...paths].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))) {
    if (reservedCandidatePath(locator)) fail("invalid_candidate", `lifecycle/private file ${locator}`);
    const file = contained(root, locator, true);
    if (!fs.existsSync(file)) { entries.push([locator, null, null]); continue; }
    const stat = fs.statSync(file); if (!stat.isFile()) fail("invalid_candidate", `not a file: ${locator}`);
    const mode = kind === "git" ? (stat.mode & 0o100 ? 0o755 : 0o644) : stat.mode & 0o777;
    entries.push([locator, mode, digest(fs.readFileSync(file))]);
  }
  return `sha256:${digest(JSON.stringify(entries))}`;
}
function gitBytes(root: string, args: string[]): Buffer {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith("GIT_")));
  try { return execFileSync("git", args, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] }); } catch { fail("invalid_git_fact", args.join(" ")); }
}
function git(root: string, args: string[]): string { return gitBytes(root, args).toString("utf8").trim(); }
export function verifyCandidate(root: string, value: CandidateRef): void {
  candidate(value);
  if (computeCandidateContentRef(root, value.paths, value.kind) !== value.content_ref) fail("candidate_mismatch", "content bytes/modes changed");
  if (value.kind === "git") {
    if (value.head_ref !== null && git(root, ["rev-parse", "HEAD"]) !== value.head_ref) fail("candidate_mismatch", "HEAD changed");
    if (value.base_ref !== null && git(root, ["rev-parse", "--verify", `${value.base_ref}^{commit}`]) !== value.base_ref) fail("candidate_mismatch", "base must be an exact commit");
  }
}
function verifyHistoricalCommit(root: string, fact: DeliveryFact): void {
  if (fact.profile !== "local_commit") return;
  if (git(root, ["cat-file", "-t", fact.commit]) !== "commit" || git(root, ["rev-parse", "--verify", `${fact.commit}^{commit}`]) !== fact.commit) fail("invalid_git_fact", "local outcome must name a full actual commit object OID");
  const entries: [string, number | null, string | null][] = [];
  for (const locator of [...fact.candidate.paths].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))) {
    if (reservedCandidatePath(locator)) fail("invalid_candidate", locator);
    const tree = git(root, ["ls-tree", fact.commit, "--", locator]);
    if (!tree) { entries.push([locator, null, null]); continue; }
    const matched = /^(100644|100755) blob [a-f0-9]+\t/.exec(tree); if (!matched) fail("invalid_git_fact", locator);
    const bytes = gitBytes(root, ["show", `${fact.commit}:${locator}`]);
    entries.push([locator, matched[1] === "100755" ? 0o755 : 0o644, digest(bytes)]);
  }
  if (`sha256:${digest(JSON.stringify(entries))}` !== fact.candidate.content_ref) fail("candidate_mismatch", "commit tree differs from delivered content");
}
function verifyFact(options: ApplyTaskV2Options, op: ReturnType<typeof parseTaskOperation>): void {
  if (op.operation !== "record_delivery" && op.operation !== "record_publication") return;
  const fact = op.result;
  if (fact.profile === "pull_request") {
    if (!options.verifyFact?.(fact)) fail("fact_verification_required", "original producer must verify actual PR facts");
  } else if (fact.profile === "local_commit") verifyHistoricalCommit(options.root, fact);
  else {
    const artifact = fact.artifact;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(artifact.locator)) { if (!options.verifyFact?.(fact)) fail("fact_verification_required", "external artifact requires original producer verification"); }
    else { const file = contained(options.root, artifact.locator); if (`sha256:${digest(fs.readFileSync(file))}` !== artifact.revision) fail("candidate_mismatch", "manual artifact content differs"); }
  }
}
/** External revisions are authored/verified by their original producer; local refs bind actual bytes or immutable Git objects. */
export function verifyAuthority(root: string, ref: AuthorityRef): void {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(ref.locator)) return;
  const file = contained(root, ref.locator);
  if (/^sha256:[a-f0-9]{64}$/.test(ref.revision)) {
    if (`sha256:${digest(fs.readFileSync(file))}` !== ref.revision) fail("authority_mismatch", ref.locator);
  } else if (/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(ref.revision)) {
    git(root, ["cat-file", "-e", `${ref.revision}:${ref.locator}`]);
  } else fail("invalid_authority_revision", "local authority requires sha256 content or exact Git revision");
}
export function applyTaskOperationToStore(options: ApplyTaskV2Options): OperationOutput {
  const op = parseTaskOperation(options.operation); const loaded = loadTaskRecordV2(options);
  if (loaded.preimage !== options.expected_preimage) fail("stale_preimage", "Task changed before operation");
  const output = applyTaskOperation(loaded.record, op, options.workflow);
  if (!output.changed) return output;
  if (op.operation === "accept_scope" || op.operation === "reopen_task") verifyAuthority(options.root, op.authority);
  else if (op.operation === "create_delivery") verifyAuthority(options.root, op.scope_ref.authority);
  else if (op.operation === "record_gate") { verifyAuthority(options.root, op.result.scope_ref.authority); verifyAuthority(options.root, op.result.plan_ref); }
  else if (op.operation === "rework" && op.scope_ref !== undefined) verifyAuthority(options.root, op.scope_ref.authority);
  else if (op.operation === "complete_task") verifyAuthority(options.root, op.result.accepted_scope);
  const historical = (op.operation === "record_delivery" || op.operation === "record_publication") && op.historical_success === true;
  if (!historical) {
    if (op.operation === "begin_check" || op.operation === "record_delivery" || op.operation === "record_publication") {
      const delivery = loaded.record.deliveries.find((item) => item.id === op.key.delivery_id);
      if (!delivery?.plan_ref) fail("gate_not_applicable", "accepted Planning required");
      verifyAuthority(options.root, delivery.scope_ref.authority);
      verifyAuthority(options.root, delivery.plan_ref);
    }
    if (op.operation === "begin_check") verifyCandidate(options.root, op.candidate);
    else if (op.operation === "record_gate" && op.result.candidate !== null) verifyCandidate(options.root, op.result.candidate);
    else if (op.operation === "record_delivery" || op.operation === "record_publication") verifyCandidate(options.root, op.result.candidate);
  }
  verifyFact(options, op); assertIdentities(loaded.record, output.record);
  const file = recordPath(options); const mode = fs.statSync(file).mode & 0o777;
  // A last preimage check covers changes during objective producer verification.
  if (fs.readFileSync(file, "utf8") !== loaded.preimage) fail("stale_preimage", "Task changed during verification");
  writeAtomic(file, serializeTaskRecordV2(output.record), mode); return output;
}
/** Read-only digest for callers retaining the exact raw preimage separately. */
export function taskPreimageDigest(preimage: string): string { return `sha256:${digest(preimage)}`; }
export { canonicalJson };
