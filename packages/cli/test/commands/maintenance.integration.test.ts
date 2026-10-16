import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { maintenance, VERSION, init } from "../../src/index.js";
import { emptyTaskRecord } from "@mindfoldhq/trellis-core/task/legacy-migration";

const temporary: string[] = [];
function temp(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-maint-api-"));
  temporary.push(root);
  return root;
}
function write(root: string, ref: string, value: string): void {
  fs.mkdirSync(path.dirname(path.join(root, ref)), { recursive: true });
  fs.writeFileSync(path.join(root, ref), value);
}
const bin = path.resolve(__dirname, "../../bin/trellis.js");
function cli(cwd: string, ...args: string[]) {
  const result = spawnSync(
    process.execPath,
    [bin, "maintain", ...args, "--json"],
    { cwd, encoding: "utf8" },
  );
  return {
    ...result,
    json: JSON.parse(result.stdout) as Record<string, unknown>,
  };
}
afterEach(() => {
  for (const root of temporary.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});
describe("public maintenance CLI and SDK", () => {
  it("keeps existing exports and prints one capability document from an unrelated outdated checkout", () => {
    expect(typeof init).toBe("function");
    expect(maintenance.getMaintenanceContract().cli_version).toBe(VERSION);
    const cwd = temp();
    write(cwd, ".trellis/.version", "0.6.1");
    const result = cli(cwd, "contract");
    expect(result.status, result.stderr).toBe(0);
    expect(result.json).toMatchObject({
      maintenance_api: "1.0",
      cli_version: VERSION,
      core_version: VERSION,
    });
    expect(result.stderr).toBe("");
  });
  it("prepares and previews read-only, then applies, recovers lost output and rolls back through the real bin", () => {
    const cwd = temp(),
      root = temp(),
      state = temp();
    const ref = ".trellis/tasks/selected",
      key = { task_id: "selected", lifecycle_generation: 0 };
    const source = JSON.stringify(
      emptyTaskRecord({ id: "selected", name: "Selected", title: "Selected" }),
    );
    write(root, `${ref}/task.json`, source);
    write(root, `${ref}/prd.md`, "Original accepted scope\n");
    const input = path.join(cwd, "input.json"),
      planFile = path.join(cwd, "plan.json");
    fs.writeFileSync(
      input,
      JSON.stringify({
        kind: "legacy_closeout",
        input: {
          root,
          key,
          task_ref: ref,
          source_kind: "schema1",
          archive_ref: ".trellis/tasks/archive/2026-10/selected",
          history_note: "Original owner: external acceptance remains pending.",
          retirements: [],
        },
      }),
    );
    const prepared = cli(cwd, "prepare", "--input", input);
    expect(prepared.status, prepared.stdout).toBe(0);
    expect(fs.readFileSync(path.join(root, ref, "task.json"), "utf8")).toBe(
      source,
    );
    fs.writeFileSync(planFile, JSON.stringify(prepared.json));
    const preview = cli(cwd, "preview", "--plan", planFile);
    expect(preview.status, preview.stdout).toBe(0);
    expect(fs.existsSync(path.join(root, ref))).toBe(true);
    const applied = cli(cwd, "apply", "--plan", planFile, "--state-dir", state);
    expect(applied.status, applied.stdout).toBe(0);
    expect(applied.json.status).toBe("applied");
    const recovery = String(applied.json.recovery_ref);
    const recovered = cli(cwd, "recover", "--recovery", recovery);
    expect(recovered.json.operation_id).toBe(prepared.json.operation_id);
    expect(recovered.json.status).toBe("applied");
    expect(cli(cwd, "resume", "--recovery", recovery).json.operation_id).toBe(
      prepared.json.operation_id,
    );
    expect(cli(cwd, "rollback", "--recovery", recovery).json.status).toBe(
      "rolled_back",
    );
    expect(fs.readFileSync(path.join(root, ref, "task.json"), "utf8")).toBe(
      source,
    );
  });
  it("returns a structured diagnostic for normal malformed input", () => {
    const root = temp(),
      input = path.join(root, "input.json");
    fs.writeFileSync(
      input,
      JSON.stringify({ kind: "tools_install", input: { root } }),
    );
    const result = cli(root, "prepare", "--input", input);
    expect(result.status).toBe(1);
    expect(result.json.error).toMatchObject({ code: "invalid_input" });
  });
});
