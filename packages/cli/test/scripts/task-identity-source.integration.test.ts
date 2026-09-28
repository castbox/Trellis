import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEMPLATE_SCRIPTS = path.resolve(__dirname, "../../src/templates/trellis/scripts");

function hasPython(): boolean {
  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function git(repo: string, ...args: string[]): void {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf-8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

function task(repo: string, ...args: string[]) {
  return spawnSync("python3", [".trellis/scripts/task.py", ...args], {
    cwd: repo,
    encoding: "utf-8",
  });
}

function taskDir(repo: string, suffix: string): string {
  const name = fs.readdirSync(path.join(repo, ".trellis/tasks"))
    .find((entry) => entry.endsWith(`-${suffix}`));
  if (!name) throw new Error(`task not found: ${suffix}`);
  return name;
}

function metadata(repo: string, name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(repo, ".trellis/tasks", name, "task.json"), "utf8"));
}

describe.skipIf(!hasPython())("task.py stable identity and source", () => {
  let repo: string;

  beforeEach(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-task-identity-"));
    git(repo, "init", "-q", "-b", "main");
    git(repo, "remote", "add", "origin", "https://example.invalid/castbox/Trellis.git");
    const scripts = path.join(repo, ".trellis/scripts");
    fs.mkdirSync(scripts, { recursive: true });
    fs.cpSync(TEMPLATE_SCRIPTS, scripts, { recursive: true });
  });

  afterEach(() => fs.rmSync(repo, { recursive: true, force: true }));

  it("creates a no-Issue task without branch metadata and archives it in a remote-backed repo", () => {
    const created = task(repo, "create", "Standalone", "--description", "Local work", "--slug", "standalone", "--creator", "test", "--assignee", "test", "--no-start");
    expect(created.status, created.stderr).toBe(0);
    const name = taskDir(repo, "standalone");
    const before = metadata(repo, name);
    expect(before.id).toBe("standalone");
    expect(before.lifecycle_generation).toBe(0);
    expect(before.source).toEqual({ kind: "no_issue" });
    expect(before).not.toHaveProperty("branch");

    const started = task(repo, "start", name, "--allow-empty-context");
    expect(started.status, started.stderr).toBe(0);
    expect(metadata(repo, name)).not.toHaveProperty("branch");

    const archived = task(repo, "archive", name, "--no-commit", "--skip-branch-validation");
    expect(archived.status, archived.stderr).toBe(0);
    const archive = path.join(repo, ".trellis/tasks/archive");
    const month = fs.readdirSync(archive)[0];
    const after = JSON.parse(fs.readFileSync(path.join(archive, month, name, "task.json"), "utf8"));
    expect(after.id).toBe(before.id);
    expect(after.source).toEqual(before.source);
    expect(after.lifecycle_generation).toBe(0);
    expect(after).not.toHaveProperty("branch");
  });

  it("writes reviewed issue source on create and preserves it through rename and archive", () => {
    const source = { kind: "issue", repo_ref: "castbox/Trellis", number: 8, disposition: "exact_source" };
    const created = task(repo, "create", "Issue work", "--description", "Issue delivery", "--slug", "issue-work", "--task-id", "Issue_8", "--source-json", JSON.stringify(source), "--creator", "test", "--assignee", "test", "--no-start");
    expect(created.status, created.stderr).toBe(0);
    const oldName = taskDir(repo, "issue-work");
    const file = path.join(repo, ".trellis/tasks", oldName, "task.json");
    const projected = metadata(repo, oldName);
    expect(projected).toMatchObject({ id: "Issue_8", source, lifecycle_generation: 0 });
    projected.lifecycle_generation = 2;
    fs.writeFileSync(file, `${JSON.stringify(projected)}\n`);

    const renamed = task(repo, "rename", oldName, "renamed-work");
    expect(renamed.status, renamed.stderr).toBe(0);
    const newName = taskDir(repo, "renamed-work");
    expect(newName).not.toBe(oldName);
    expect(metadata(repo, newName)).toMatchObject({ id: "Issue_8", source: projected.source, lifecycle_generation: 2 });

    const archived = task(repo, "archive", newName, "--no-commit");
    expect(archived.status, archived.stderr).toBe(0);
    const archive = path.join(repo, ".trellis/tasks/archive");
    const month = fs.readdirSync(archive)[0];
    const after = JSON.parse(fs.readFileSync(path.join(archive, month, newName, "task.json"), "utf8"));
    expect(after).toMatchObject({ id: "Issue_8", source: projected.source, lifecycle_generation: 2 });
  });

  it("rejects malformed or incomplete issue source before creating a task", () => {
    for (const source of [
      "{",
      JSON.stringify({ kind: "issue", repo_ref: "castbox/Trellis", number: 8 }),
      JSON.stringify({ kind: "issue", repo_ref: "castbox/Trellis", number: true, disposition: "exact_source" }),
      JSON.stringify({ kind: "issue", repo_ref: "castbox/Trellis", number: 8, disposition: "follow_up" }),
    ]) {
      const result = task(repo, "create", "Issue work", "--description", "Issue delivery", "--slug", "issue-work", "--source-json", source, "--creator", "test", "--assignee", "test", "--no-start");
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("--source-json");
      expect(fs.existsSync(path.join(repo, ".trellis/tasks"))).toBe(false);
    }
  });

  it("does not replace an existing TaskId or issue source with --force", () => {
    const source = { kind: "issue", repo_ref: "castbox/Trellis", number: 8, disposition: "exact_source" };
    const args = ["create", "Issue work", "--description", "Issue delivery", "--slug", "issue-work", "--task-id", "Issue_8", "--source-json", JSON.stringify(source), "--creator", "test", "--assignee", "test", "--no-start"];
    expect(task(repo, ...args).status).toBe(0);
    const name = taskDir(repo, "issue-work");
    const before = metadata(repo, name);

    const replaced = task(repo, "create", "Other work", "--description", "Different task", "--slug", "issue-work", "--task-id", "other-id", "--creator", "test", "--assignee", "test", "--no-start", "--force");
    expect(replaced.status).toBe(1);
    expect(replaced.stderr).toContain("task_id_collision");
    expect(metadata(repo, name)).toEqual(before);
  });

  it("rejects a duplicate TaskId in another registered worktree", () => {
    git(repo, "config", "user.email", "test@example.invalid");
    git(repo, "config", "user.name", "Test");
    git(repo, "add", ".trellis/scripts");
    git(repo, "commit", "-qm", "fixture");
    const linked = `${repo}-linked`;
    git(repo, "worktree", "add", "-q", "-b", "linked", linked, "HEAD");
    try {
      const first = task(repo, "create", "First", "--description", "First task", "--slug", "first", "--task-id", "shared-id", "--creator", "test", "--assignee", "test", "--no-start");
      expect(first.status, first.stderr).toBe(0);
      const second = task(linked, "create", "Second", "--description", "Second task", "--slug", "second", "--task-id", "shared-id", "--creator", "test", "--assignee", "test", "--no-start");
      expect(second.status).toBe(1);
      expect(second.stderr).toContain("task_id_collision");
      expect(fs.readdirSync(path.join(linked, ".trellis/tasks")).filter((entry) => entry !== "archive")).toEqual([]);
    } finally {
      git(repo, "worktree", "remove", "--force", linked);
    }
  });

  it("rejects a legacy invalid TaskId before session binding or archive", () => {
    const created = task(repo, "create", "Legacy", "--description", "Legacy task", "--slug", "legacy", "--creator", "test", "--assignee", "test", "--no-start");
    expect(created.status, created.stderr).toBe(0);
    const name = taskDir(repo, "legacy");
    const file = path.join(repo, ".trellis/tasks", name, "task.json");
    const data = metadata(repo, name);
    data.id = "legacy task";
    fs.writeFileSync(file, `${JSON.stringify(data)}\n`);
    const started = spawnSync("python3", [".trellis/scripts/task.py", "start", name, "--allow-empty-context"], {
      cwd: repo, encoding: "utf-8", env: { ...process.env, TRELLIS_CONTEXT_ID: "identity-test" },
    });
    expect(started.status).toBe(1);
    expect(started.stdout + started.stderr).toContain("invalid_task_id");
    expect(fs.existsSync(path.join(repo, ".git/trellis/sessions"))).toBe(false);
    const contextless = task(repo, "start", name, "--allow-empty-context");
    expect(contextless.status).toBe(1);
    expect(contextless.stdout + contextless.stderr).toContain("invalid_task_id");
    expect(metadata(repo, name).status).toBe("planning");
    const archived = task(repo, "archive", name, "--no-commit");
    expect(archived.status).toBe(1);
    expect(archived.stderr).toContain("invalid_task_id");
    expect(fs.existsSync(file)).toBe(true);
  });

});
