import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import type { AuthorityRef, CandidateRef, GateResult, TaskRecordV2, WorkflowContract } from "@mindfoldhq/trellis-core/task/v2";

const scripts = path.resolve(__dirname, "../../src/templates/trellis/scripts");
const fixtures = path.resolve(__dirname, "../../../core/test/fixtures/task-v2");
const python = process.platform === "darwin" ? "/usr/bin/python3" : "python3";
const available = spawnSync(python, ["--version"]).status === 0;
const native = JSON.parse(fs.readFileSync(path.join(fixtures, "native-multi.json"), "utf8")) as { workflow: WorkflowContract; initial: TaskRecordV2 };
const d1 = "11111111-1111-4111-8111-111111111111";
const d2 = "22222222-2222-4222-8222-222222222222";
const digest = (value: string | Buffer): string => `sha256:${createHash("sha256").update(value).digest("hex")}`;

function install(root: string): void {
  fs.mkdirSync(path.join(root, ".trellis"), { recursive: true });
  fs.cpSync(scripts, path.join(root, ".trellis/scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, ".trellis/workflow.md"), `[trellis-runtime-contract]\n${JSON.stringify(native.workflow)}\n[/trellis-runtime-contract]\n`);
}
function run(root: string, entry: string, args: string[], key = "delivery-v2-test") {
  return spawnSync(python, [`.trellis/scripts/${entry}.py`, ...args], {
    cwd: root, encoding: "utf8", env: { ...process.env, TRELLIS_CONTEXT_ID: key },
  });
}
function ok(root: string, entry: string, args: string[], key?: string): string {
  const result = run(root, entry, args, key);
  expect(result.status, `${entry} ${args[0]}: ${result.stderr}\n${result.stdout}`).toBe(0);
  return result.stdout;
}
function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

const parityProgram = `
import json,sys,tempfile
from pathlib import Path
from common.delivery_operations import apply_operation
from common.delivery_schema import DeliveryError,parse_task_v2
from common.delivery_store import candidate_content_ref
fixture=json.load(open(sys.argv[1],encoding='utf-8'))
record=fixture['initial']; observations=[]
for case in fixture.get('hash_cases',[]):
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        for name,contents in case['files'].items():
            file=root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text(contents,encoding='utf-8');file.chmod(0o644)
        observations.append({'name':case['name'],'content_ref':candidate_content_ref(root,case['paths'])})
for case in fixture.get('schema_cases',[]):
    try: parse_task_v2(case['input']); observations.append({'name':case['name'],'error':None})
    except DeliveryError as exc: observations.append({'name':case['name'],'error':exc.code})
for step in fixture['steps']:
    try:
        result=apply_operation(record,step['operation'],fixture['workflow'])
        record=result['record']; observations.append({'phase':result['phase'],'changed':result['changed']})
    except DeliveryError as exc: observations.append({'error':exc.code})
print(json.dumps({'observations':observations,'record':record}))
`;

interface Step { expect_error?: string; expected_phase?: string; expected_changed?: boolean }
interface Fixture { steps: Step[]; schema_cases?: { name: string; expect_error: string }[]; hash_cases?: { name: string; content_ref: string }[] }

describe.skipIf(!available)("Delivery v2 shipped Python (minimum interpreter)", () => {
  let root: string;
  let task: string;
  const extra: string[] = [];
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-delivery-v2-"));
    install(root);
    ok(root, "task", ["create", "Delivery fixture", "--description", "Independent slices", "--slug", "fixture", "--task-id", "fixture-task", "--schema-version", "2.0", "--no-start"]);
    task = `.trellis/tasks/${fs.readdirSync(path.join(root, ".trellis/tasks")).find((name) => name.endsWith("-fixture"))}`;
    fs.writeFileSync(path.join(root, "requirements.md"), "R1: retained artifact\nR2: second slice\n");
    fs.writeFileSync(path.join(root, "plan.md"), "Reviewed plan\n");
    fs.writeFileSync(path.join(root, "artifact.txt"), "Accepted artifact\n");
    fs.chmodSync(path.join(root, "artifact.txt"), 0o644);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    for (const directory of [root, ...extra.splice(0)]) fs.rmSync(directory, { recursive: true, force: true });
  });
  function ref(file: string): AuthorityRef { return { locator: file, revision: digest(fs.readFileSync(path.join(root, file))) }; }
  function record(): TaskRecordV2 { return JSON.parse(fs.readFileSync(path.join(root, task, "task.json"), "utf8")) as TaskRecordV2; }
  function operation(name: string, role: keyof WorkflowContract["owners"], fields: Record<string, unknown>, deliveryId?: string, generation = 0) {
    return { api_version: "1.0", operation: name, key: { task_id: "fixture-task", lifecycle_generation: generation, ...(deliveryId ? { delivery_id: deliveryId } : {}) }, owner_role: role, owner_id: native.workflow.owners[role], ...fields };
  }
  function apply(value: object): Record<string, unknown> { return JSON.parse(ok(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(value)])) as Record<string, unknown>; }
  function prepare(deliveryId = d1, profile = "manual"): void {
    if (record().accepted_scope === null) apply(operation("accept_scope", "task_scope", { authority: ref("requirements.md") }));
    apply(operation("create_delivery", "creation", { scope_ref: { authority: ref("requirements.md"), anchors: ["R1"] }, profile }, deliveryId));
  }
  function gate(role: GateResult["owner_role"], phase: string, candidate: CandidateRef | null, previous: string | null, deliveryId = d1): string {
    const resultId = `${deliveryId}-${role}`;
    apply(operation("record_gate", role, {
      expected_phase: phase,
      result: { result_id: resultId, owner_role: role, owner_id: native.workflow.owners[role], outcome: role === "planning" ? "accepted" : role === "readiness" ? "ready" : "passed", scope_ref: { authority: ref("requirements.md"), anchors: ["R1"] }, plan_ref: ref("plan.md"), candidate, predecessor_result_id: previous, obligations: [], evidence: [ref("plan.md")] },
    }, deliveryId));
    return resultId;
  }
  function candidate(gitProject = false): CandidateRef {
    const hash = JSON.parse(ok(root, "delivery", ["candidate", "--paths", "artifact.txt"])) as { content_ref: string };
    return { kind: gitProject ? "git" : "git_free", ...hash, paths: ["artifact.txt"], head_ref: gitProject ? git(root, "rev-parse", "HEAD") : null, base_ref: null };
  }
  function ready(gitProject = false): CandidateRef {
    const planning = gate("planning", "planning", null, null);
    const current = candidate(gitProject);
    apply(operation("begin_check", "implementation", { expected_phase: "implementing", candidate: current }, d1));
    const check = gate("check", "checking", current, planning);
    const review = gate("full_review", "reviewing", current, check);
    gate("readiness", "reviewing", current, review);
    return current;
  }

  for (const file of fs.readdirSync(fixtures).filter((name) => name.endsWith(".json"))) {
    it(`matches Core-owned schema/transition fixture ${file}`, () => {
      const fixture = JSON.parse(fs.readFileSync(path.join(fixtures, file), "utf8")) as Fixture;
      const process = spawnSync(python, ["-c", parityProgram, path.join(fixtures, file)], { encoding: "utf8", env: { ...globalThis.process.env, PYTHONPATH: scripts } });
      expect(process.status, process.stderr).toBe(0);
      const output = JSON.parse(process.stdout) as { observations: Record<string, unknown>[] };
      const schemas = fixture.schema_cases ?? [];
      const hashes = fixture.hash_cases ?? [];
      hashes.forEach((item, index) => expect(output.observations[index]).toEqual({ name: item.name, content_ref: item.content_ref }));
      schemas.forEach((item, index) => expect(output.observations[index + hashes.length]).toEqual({ name: item.name, error: item.expect_error }));
      fixture.steps.forEach((step, index) => {
        const observation = output.observations[index + schemas.length + hashes.length];
        if (step.expect_error) expect(observation).toEqual({ error: step.expect_error });
        else {
          expect(observation).not.toHaveProperty("error");
          if (step.expected_phase !== undefined) expect(observation?.phase).toBe(step.expected_phase);
          if (step.expected_changed !== undefined) expect(observation?.changed).toBe(step.expected_changed);
        }
      });
    });
  }

  it("manual two-slice execution retains plans, separates binding/activation/Completion/Closure/archive", () => {
    ok(root, "task", ["start", task]);
    prepare();
    expect(JSON.parse(ok(root, "delivery", ["current", "--json"])).kind).toBe("no_current_delivery");
    ok(root, "delivery", ["select", "--task", task, "--delivery", d1]);
    expect(record().deliveries[0]?.phase).toBe("planning");
    const current = ready();
    const result = operation("record_delivery", "delivery", { expected_phase: "publishing", result: { result_id: "manual-delivered", owner_id: native.workflow.owners.delivery, evidence: [ref("artifact.txt")], candidate: current, profile: "manual", artifact: ref("artifact.txt") } }, d1);
    apply(result);
    expect(JSON.parse(ok(root, "delivery", ["current", "--json"])).kind).toBe("no_current_delivery");
    expect(record().completion_results).toEqual([]);
    const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    expect(apply(result).changed).toBe(false);
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
    prepare(d2);
    ok(root, "delivery", ["select", "--task", task, "--delivery", d2]);
    apply(operation("stop", "planning", { expected_phase: "planning", result: { result_id: "stopped-d2", owner_id: native.workflow.owners.planning, evidence: [ref("requirements.md")], reason: ref("requirements.md"), scope_decision: ref("requirements.md") } }, d2));
    expect(record().deliveries.map((d) => d.phase)).toEqual(["delivered", "stopped"]);
    expect(fs.existsSync(path.join(root, task, `deliveries/${d1}/design.md`))).toBe(true);
    expect(fs.existsSync(path.join(root, task, `deliveries/${d2}/design.md`))).toBe(true);
    expect(run(root, "task", ["archive", task]).stderr).toContain("completion_and_closure_required");
    apply(operation("complete_task", "completion", { result: { result_id: "completed-g0", owner_id: native.workflow.owners.completion, evidence: [ref("requirements.md")], lifecycle_generation: 0, accepted_scope: ref("requirements.md"), delivery_result_ids: ["manual-delivered"], outcome: "completed" } }));
    expect(run(root, "task", ["archive", task]).stderr).toContain("completion_and_closure_required");
    apply(operation("close_task", "closure", { result: { result_id: "closed-g0", owner_id: native.workflow.owners.closure, evidence: [ref("requirements.md")], lifecycle_generation: 0, completion_result_id: "completed-g0", disposition: "no_mutation", source_result: null } }));
    fs.writeFileSync(path.join(root, ".trellis/config.yaml"), "task_auto_commit: false\n");
    ok(root, "task", ["archive", task]);
    const archived = path.join(root, ".trellis/tasks/archive", fs.readdirSync(path.join(root, ".trellis/tasks/archive"))[0] as string, path.basename(task), "task.json");
    expect(JSON.parse(fs.readFileSync(archived, "utf8"))).not.toHaveProperty("status");
    expect(JSON.parse(ok(root, "delivery", ["current", "--json"])).kind).toBe("no_current_task");
  });

  it("retains a clean local commit through formal gates and recovers historical actual success after edits", () => {
    git(root, "init", "-q"); git(root, "add", "artifact.txt", "requirements.md", "plan.md");
    git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "actual content");
    ok(root, "task", ["start", task]);
    prepare(d1, "local_commit"); const beforeHead = git(root, "rev-parse", "HEAD");
    const current = ready(true);
    apply(operation("record_delivery", "delivery", { expected_phase: "publishing", result: { result_id: "local-delivered", owner_id: native.workflow.owners.delivery, evidence: [ref("artifact.txt")], candidate: current, profile: "local_commit", commit: beforeHead } }, d1));
    expect(git(root, "rev-parse", "HEAD")).toBe(beforeHead);
    prepare(d2, "local_commit"); gate("planning", "planning", null, null, d2);
    fs.writeFileSync(path.join(root, "artifact.txt"), "new pending content");
    apply(operation("record_delivery", "delivery", { expected_phase: "implementing", historical_success: true, result: { result_id: "historical-local", owner_id: native.workflow.owners.delivery, evidence: [ref("plan.md")], candidate: current, profile: "local_commit", commit: beforeHead } }, d2));
    expect(record().deliveries[1]?.results.check).toBeNull();
    expect(record().deliveries[1]?.phase).toBe("delivered");
  });

  it("refreshes same-PR publication after real candidate rework and recovers lost projection with missing gates", () => {
    git(root, "init", "-q"); git(root, "add", "artifact.txt", "requirements.md", "plan.md");
    git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "initial candidate");
    prepare(d1, "pull_request"); const original = ready(true);
    const bin = path.join(root, "fixture-bin"); fs.mkdirSync(bin);
    const actualFile = path.join(bin, "actual-pr.json"); const callsFile = path.join(bin, "gh-calls.jsonl");
    fs.writeFileSync(path.join(bin, "gh"), `#!${python.startsWith("/") ? python : "/usr/bin/env python3"}
import json,sys
from pathlib import Path
assert sys.argv[1:3] == ['pr','view'], 'only read-only PR verification is allowed'
base=Path(__file__).parent
with (base/'gh-calls.jsonl').open('a') as log: log.write(json.dumps(sys.argv[1:])+'\\n')
print((base/'actual-pr.json').read_text())
`); fs.chmodSync(path.join(bin, "gh"), 0o755);
    vi.stubEnv("PATH", `${bin}${path.delimiter}${process.env.PATH ?? ""}`);
    let actual = { number: 123, headRefOid: original.head_ref, baseRefName: "main", state: "OPEN", mergeCommit: null as { oid: string } | null, url: "https://example.test/pr/123", body: "Original accepted payload" };
    const saveActual = (): void => fs.writeFileSync(actualFile, JSON.stringify(actual)); saveActual();
    const publication = { result_id: "pr-original", owner_id: native.workflow.owners.publication, evidence: [ref("plan.md")], profile: "pull_request", candidate: original, repo_ref: "castbox/Trellis", pr_number: 123, reviewed_head: original.head_ref, target_ref: "main", publication_ref: { locator: actual.url, revision: digest(actual.body) } };
    const publish = (result: typeof publication, historical = false) => operation("record_publication", "publication", { expected_phase: "publishing", ...(historical ? { historical_success: true } : {}), result }, d1);
    apply(publish(publication));
    apply(operation("rework", "publication", { expected_phase: "publishing", target_role: "implementation", reason: ref("plan.md"), affected_results: ["check", "full_review", "readiness"] }, d1));
    expect(record().deliveries[0]?.publication_result).toEqual(publication);
    fs.writeFileSync(path.join(root, "artifact.txt"), "Revised actual artifact\n");
    git(root, "add", "artifact.txt"); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "revised candidate");
    const revisedCandidate = candidate(true);
    apply(operation("begin_check", "implementation", { expected_phase: "implementing", candidate: revisedCandidate }, d1));
    let previous = `${d1}-planning`;
    for (const role of ["check", "full_review", "readiness"] as const) {
      const resultId = `revised-${role}`;
      apply(operation("record_gate", role, { expected_phase: role === "check" ? "checking" : "reviewing", result: { result_id: resultId, owner_role: role, owner_id: native.workflow.owners[role], outcome: role === "readiness" ? "ready" : "passed", scope_ref: { authority: ref("requirements.md"), anchors: ["R1"] }, plan_ref: ref("plan.md"), candidate: revisedCandidate, predecessor_result_id: previous, obligations: [], evidence: [ref("plan.md")] } }, d1)); previous = resultId;
    }
    const revised = { ...publication, result_id: "pr-revised", candidate: revisedCandidate, reviewed_head: revisedCandidate.head_ref, target_ref: "release", publication_ref: { locator: actual.url, revision: digest("Revised accepted payload") } };
    const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(publish(revised))]).stderr).toContain("candidate_mismatch");
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
    actual = { ...actual, headRefOid: revisedCandidate.head_ref, baseRefName: "release", body: "Revised accepted payload" }; saveActual();
    apply(publish(revised));
    const readiness = record().deliveries[0]?.results.readiness; if (!readiness) throw new Error("missing readiness");
    apply(operation("rework", "publication", { expected_phase: "publishing", target_role: "readiness", reason: ref("plan.md"), affected_results: ["readiness"] }, d1));
    actual.body = "Actual successful update with lost projection"; saveActual();
    const recovered = { ...revised, result_id: "pr-recovered", publication_ref: { locator: actual.url, revision: digest(actual.body) } };
    expect(apply(publish(recovered, true)).phase).toBe("reviewing");
    expect(record().deliveries[0]?.results.readiness).toBeNull();
    const recoveredBytes = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    for (const stale of [publication, revised]) {
      expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(publish(stale, true))]).stderr).toContain("candidate_mismatch");
      expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(recoveredBytes);
    }
    const calls = fs.readFileSync(callsFile, "utf8");
    expect(apply(publish(recovered, true)).changed).toBe(false);
    expect(fs.readFileSync(callsFile, "utf8")).toBe(calls);
    const conflict = { ...recovered, publication_ref: { ...recovered.publication_ref, revision: digest("wrong") } };
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(publish(conflict, true))]).stderr).toContain("result_identity_conflict");
    apply(operation("record_gate", "readiness", { expected_phase: "reviewing", result: { ...readiness, result_id: "recovered-readiness", obligations: [recovered.publication_ref] } }, d1));
    actual.state = "MERGED"; actual.mergeCommit = { oid: "f".repeat(40) }; saveActual();
    const delivered = { result_id: "pr-delivered", owner_id: native.workflow.owners.delivery, evidence: [ref("plan.md")], profile: "pull_request", candidate: revisedCandidate, repo_ref: recovered.repo_ref, pr_number: recovered.pr_number, reviewed_head: revisedCandidate.head_ref, target_ref: recovered.target_ref, merge_commit: actual.mergeCommit.oid };
    expect(apply(operation("record_delivery", "delivery", { expected_phase: "publishing", result: delivered }, d1)).phase).toBe("delivered");
    expect(record().deliveries[0]?.publication_result).toEqual(recovered);
    expect(git(root, "rev-parse", "HEAD")).toBe(revisedCandidate.head_ref);
  });

  it("fails stale bytes, changed candidate, unsupported workflow and direct lifecycle overwrite without mutation", () => {
    ok(root, "task", ["start", task]);
    prepare(); gate("planning", "planning", null, null);
    const current = candidate(); const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    const begin = operation("begin_check", "implementation", { expected_phase: "implementing", candidate: current }, d1);
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(begin), "--expected-sha256", `sha256:${"0".repeat(64)}`]).stderr).toContain("stale_preimage");
    fs.writeFileSync(path.join(root, "artifact.txt"), "changed");
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(begin)]).stderr).toContain("candidate_mismatch");
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
    const bypass = spawnSync(python, ["-c", "import sys,json;from pathlib import Path;from common.io import write_json;p=Path(sys.argv[1]);d=json.loads(p.read_text());d['deliveries']=[];print(write_json(p,d))", path.join(root, task, "task.json")], { encoding: "utf8", env: { ...process.env, PYTHONPATH: scripts } });
    expect(bypass.stdout.trim()).toBe("False");
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
    fs.writeFileSync(path.join(root, ".trellis/workflow.md"), "legacy workflow\n");
    const invalid = run(root, "delivery", ["current", "--json"]);
    expect(invalid.status).toBe(1); expect(invalid.stdout).toContain("missing_runtime_contract");
    const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-no-contract-")); extra.push(isolated); install(isolated); fs.writeFileSync(path.join(isolated, ".trellis/workflow.md"), "legacy\n");
    expect(run(isolated, "task", ["create", "bad", "--description", "bad", "--schema-version", "2.0"]).status).toBe(1);
    expect(fs.existsSync(path.join(isolated, ".trellis/tasks"))).toBe(false);
  });

  it("resolves sibling-worktree selection and preserves Task binding through formal reopen", () => {
    git(root, "init", "-q"); git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-qm", "init");
    const sibling = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-sibling-")); extra.push(sibling);
    git(root, "worktree", "add", "--detach", sibling); install(sibling);
    ok(root, "task", ["start", task]);
    prepare(); ok(root, "delivery", ["select", "--task", task, "--delivery", d1]);
    const queried = JSON.parse(ok(sibling, "delivery", ["current", "--json"])) as { kind: string; key: { delivery_id: string } };
    expect(queried.kind).toBe("current"); expect(queried.key.delivery_id).toBe(d1);
    apply(operation("stop", "planning", { expected_phase: "planning", result: { result_id: "stop-for-scope", owner_id: native.workflow.owners.planning, evidence: [ref("requirements.md")], reason: ref("requirements.md"), scope_decision: ref("requirements.md") } }, d1));
    apply(operation("complete_task", "completion", { result: { result_id: "scope-complete", owner_id: native.workflow.owners.completion, evidence: [ref("requirements.md")], lifecycle_generation: 0, accepted_scope: ref("requirements.md"), delivery_result_ids: [], outcome: "completed" } }));
    apply(operation("reopen_task", "task_scope", { authority: ref("requirements.md") }));
    const current = JSON.parse(ok(sibling, "delivery", ["current", "--json"])) as { kind: string; key: { lifecycle_generation: number } };
    expect(current.kind).toBe("no_current_delivery"); expect(current.key.lifecycle_generation).toBe(1);
    expect(record().deliveries[0]?.lifecycle_generation).toBe(0);
    expect(record().completion_results[0]?.result_id).toBe("scope-complete");
  });

  it("per-Delivery manifests require explicit selection and never write root manifest", () => {
    prepare();
    const missing = run(root, "task", ["add-context", task, "implement", "requirements.md", "whole scope"]);
    expect(missing.status).toBe(1); expect(missing.stdout).toContain("delivery_selection_required");
    ok(root, "task", ["add-context", task, "implement", "requirements.md", "whole scope", "--delivery", d1]);
    expect(fs.readFileSync(path.join(root, task, `deliveries/${d1}/implement.jsonl`), "utf8")).toContain("whole scope");
    expect(fs.existsSync(path.join(root, task, "implement.jsonl"))).toBe(false);
    expect(run(root, "delivery", ["candidate", "--paths", `${task}/task.json`]).stderr).toContain("invalid_candidate");
  });

  it("normal forward operations reject changed local scope/plan before recording facts", () => {
    prepare(); const planning = gate("planning", "planning", null, null);
    const current = candidate();
    const begin = operation("begin_check", "implementation", { expected_phase: "implementing", candidate: current }, d1);
    for (const file of ["requirements.md", "plan.md"]) {
      const saved = fs.readFileSync(path.join(root, file));
      const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
      fs.writeFileSync(path.join(root, file), "unaccepted draft\n");
      expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(begin)]).stderr).toContain("authority_mismatch");
      expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
      fs.writeFileSync(path.join(root, file), saved);
    }
    apply(begin);
    const check = gate("check", "checking", current, planning);
    const review = gate("full_review", "reviewing", current, check);
    gate("readiness", "reviewing", current, review);
    const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    fs.writeFileSync(path.join(root, "plan.md"), "changed after readiness\n");
    const delivered = operation("record_delivery", "delivery", { expected_phase: "publishing", result: { result_id: "stale-forward", owner_id: native.workflow.owners.delivery, evidence: [ref("artifact.txt")], candidate: current, profile: "manual", artifact: ref("artifact.txt") } }, d1);
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(delivered)]).stderr).toContain("authority_mismatch");
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
  });

  it("preflights nested planning symlinks before changing the aggregate and does not infer missing-child completion", () => {
    apply(operation("accept_scope", "task_scope", { authority: ref("requirements.md") }));
    const before = fs.readFileSync(path.join(root, task, "task.json"), "utf8");
    const directory = path.join(root, task, `deliveries/${d1}`);
    fs.mkdirSync(directory, { recursive: true });
    fs.symlinkSync(path.join(root, "plan.md"), path.join(directory, "design.md"));
    const request = operation("create_delivery", "creation", { scope_ref: { authority: ref("requirements.md"), anchors: ["R1"] }, profile: "manual" }, d1);
    expect(run(root, "delivery", ["apply", "--task", task, "--input", JSON.stringify(request)]).stderr).toContain("invalid_locator");
    expect(fs.readFileSync(path.join(root, task, "task.json"), "utf8")).toBe(before);
    const inventory = record(); inventory.children = ["missing-child"];
    fs.writeFileSync(path.join(root, task, "task.json"), JSON.stringify(inventory));
    expect(ok(root, "task", ["list"])).toContain("[0/1 done]");
    expect(run(root, "delivery", ["candidate", "--paths", `${task}/deliveries/${d1}/design.md`]).stderr).toContain("invalid_locator");
  });
});
