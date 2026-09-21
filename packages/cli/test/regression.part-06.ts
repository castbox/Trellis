// Mechanical split of regression.test.ts; imported by the canonical test entry.

import { execSync, spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllScripts } from "../src/templates/trellis/index.js";
// =============================================================================
// safe-commit: gitignored .trellis/ recovery (0.5.10 → 0.5.11)
// =============================================================================
//
// Real user incident: project .gitignore listed `.trellis/`. add_session.py's
// auto-commit ran `git add .trellis/workspace .trellis/tasks`, got `ignored
// by .gitignore`, fell back to a hint suggesting `git add .trellis &&
// commit`. The AI agent driving the workflow extrapolated that to
// `git add -f .trellis/`, which forced in `.trellis/.backup-*/`,
// `.trellis/worktrees/`, `.trellis/.template-hashes.json`, etc. — 548 files
// / 83474 lines of caches/backups committed.
//
// 0.5.10 fix (since reverted):
//   - Scripts only stage SPECIFIC product paths.
//   - On `ignored by` the scripts retried with `git add -f <specific paths>`.
// That auto-`-f` was an over-fix — when a user gitignores `.trellis/` they
// mean "keep .trellis/ local-only", and forcing the commit through (even on
// narrow paths) violates user intent. Group-chat report: a finish-work auto
// committed `.trellis/workspace/` straight into a repo whose .gitignore
// excluded `.trellis/`.
//
// 0.5.11 fix (current):
//   - Plain `git add <specific>` is tried once. On `ignored by`, the script
//     warns and skips the auto-commit — never `-f`.
//   - New `session_auto_commit: false` config opts the user out of auto-stage
//     and auto-commit entirely (issue #245).
//   - The warning explicitly says ``Do NOT use `git add -f .trellis/```` so
//     AI re-reading the log doesn't reinvent the bug, and points at the new
//     `session_auto_commit: false` knob.
//
// These tests synthesize a tmp git repo with `.trellis/` gitignored and
// verify (a) on `ignored by` the script warns + skips (no commit, no -f),
// (b) `session_auto_commit: false` skips git entirely in any state, and
// (c) the negative-rule warning + new config hint are reachable.
// =============================================================================

describe("regression: safe auto-commit when .trellis/ is gitignored (0.5.10 → 0.5.11)", () => {
  let tmpDir: string;
  const pyCmd = process.platform === "win32" ? "python" : "python3";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-safe-commit-"));
    execSync("git init -q -b main", { cwd: tmpDir });
    // Configure user so git commit succeeds in CI sandboxes.
    execSync('git config user.email "test@trellis.local"', { cwd: tmpDir });
    execSync('git config user.name "Trellis Test"', { cwd: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeFile(rel: string, content: string): void {
    const abs = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  }

  function writeTrellisScripts(): void {
    const scriptsDir = path.join(tmpDir, ".trellis", "scripts");
    for (const [rel, content] of getAllScripts()) {
      const abs = path.join(scriptsDir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
    }
  }

  function writeWorkspaceIndex(): void {
    writeFile(
      ".trellis/workspace/test-dev/index.md",
      [
        "# Workspace Index - test-dev",
        "",
        "## Current Status",
        "",
        "<!-- @@@auto:current-status -->",
        "- **Active File**: `journal-1.md`",
        "- **Total Sessions**: 0",
        "- **Last Active**: -",
        "<!-- @@@/auto:current-status -->",
        "",
        "## Active Documents",
        "",
        "<!-- @@@auto:active-documents -->",
        "| File | Lines | Status |",
        "|------|-------|--------|",
        "| `journal-1.md` | ~0 | Active |",
        "<!-- @@@/auto:active-documents -->",
        "",
        "## Session History",
        "",
        "<!-- @@@auto:session-history -->",
        "| # | Date | Title | Commits | Branch |",
        "|---|------|-------|---------|--------|",
        "<!-- @@@/auto:session-history -->",
        "",
      ].join("\n"),
    );
  }

  function setupRepo(options?: { gitignoreTrellis?: boolean }): void {
    writeTrellisScripts();
    writeFile(
      ".trellis/.developer",
      "name=test-dev\ninitialized_at=2026-05-09T00:00:00\n",
    );
    writeFile(
      ".trellis/workspace/test-dev/journal-1.md",
      "# Journal - test-dev (Part 1)\n\n---\n",
    );
    writeWorkspaceIndex();
    // Ignored caches/backups must exist on disk to prove they don't get
    // staged when -f is forced on specific paths.
    writeFile(
      ".trellis/.backup-2026-05-09/should-not-be-committed.txt",
      "secret-backup\n",
    );
    writeFile(
      ".trellis/worktrees/wt-a/should-not-be-committed.txt",
      "secret-worktree\n",
    );
    writeFile(
      ".trellis/.template-hashes.json",
      '{"_": "should-not-be-committed"}\n',
    );
    writeFile(
      ".trellis/.runtime/sessions/should-not-be-committed.json",
      JSON.stringify({
        schema_version: 2,
        task_id: "unrelated-fixture",
        lifecycle_generation: 0,
      }) + "\n",
    );
    writeFile(
      ".trellis/tasks/unrelated-fixture/task.json",
      JSON.stringify({
        id: "unrelated-fixture",
        name: "unrelated-fixture",
        lifecycle_generation: 0,
        title: "Unrelated fixture",
        status: "planning",
      }) + "\n",
    );

    if (options?.gitignoreTrellis) {
      writeFile(".gitignore", ".trellis/\n");
    }
    // Seed an initial commit so HEAD exists.
    writeFile("README.md", "test\n");
    execSync("git add README.md", { cwd: tmpDir });
    if (options?.gitignoreTrellis) {
      execSync("git add .gitignore", { cwd: tmpDir });
    }
    execSync('git commit -q -m "init"', { cwd: tmpDir });
  }

  function listCommittedFiles(): string[] {
    const out = execSync("git ls-tree -r --name-only HEAD", {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    return out.split("\n").filter((l) => l.length > 0);
  }

  it("[gitignore-trellis] safe_commit module ships and contains the negative warning + new config hint", () => {
    // The warning's exact text matters because AI agents read it.
    // Specifically the negative example must appear verbatim so any future
    // refactor that removes it will fail this test. 0.5.11 also adds the
    // new session_auto_commit hint.
    const safeCommit = getAllScripts().get("common/safe_commit.py");
    expect(safeCommit).toBeTruthy();
    expect(safeCommit).toContain("Do NOT use `git add -f .trellis/`");
    expect(safeCommit).toContain("safe_archive_paths_to_add");
    expect(safeCommit).toContain("safe_git_add");
    // 0.5.11: new hint pointing users at the config knob.
    expect(safeCommit).toContain("task_auto_commit: false");
    // 0.5.11: auto -f retry must be gone. The function body should no
    // longer issue `git add -f`.
    expect(safeCommit).not.toMatch(/\["add", "-f", "--",/);
  });

  it("[gitignore-trellis] task.py archive warns and skips when .trellis/ is ignored (default mode)", () => {
    setupRepo({ gitignoreTrellis: true });
    // Create a task to archive.
    writeFile(
      ".trellis/tasks/issue-500/task.json",
      JSON.stringify(
        {
          id: "issue-500",
          name: "issue-500",
          lifecycle_generation: 0,
          title: "Test archive",
          status: "in_progress",
          package: null,
        },
        null,
        2,
      ),
    );
    writeFile(".trellis/tasks/issue-500/prd.md", "# PRD\n");

    const taskScriptPath = path.join(tmpDir, ".trellis", "scripts", "task.py");
    const result = spawnSync(pyCmd, [taskScriptPath, "archive", "issue-500"], {
      cwd: tmpDir,
      encoding: "utf-8",
      env: { ...process.env, TRELLIS_CONTEXT_ID: "session-arch" },
    });
    const stderr = result.stderr ?? "";
    // 0.5.11: must NOT retry with -f, must NOT auto-commit. Warning must
    // surface so the user knows their .gitignore won.
    expect(stderr).not.toContain("Auto-committed");
    expect(stderr).toContain("ignored by your .gitignore");
    expect(stderr).toContain("Do NOT use `git add -f .trellis/`");

    const tracked = listCommittedFiles();
    // Nothing under .trellis/ should be tracked.
    for (const t of tracked) {
      expect(
        t.startsWith(".trellis/"),
        `should not commit anything under .trellis/ (got: ${t})`,
      ).toBe(false);
    }

    // The archive directory move on disk still happened — only git was
    // untouched.
    const archiveExists = fs
      .readdirSync(path.join(tmpDir, ".trellis/tasks/archive"))
      .some((monthDir) => {
        const monthPath = path.join(tmpDir, ".trellis/tasks/archive", monthDir);
        return (
          fs.statSync(monthPath).isDirectory() &&
          fs.existsSync(path.join(monthPath, "issue-500"))
        );
      });
    expect(archiveExists).toBe(true);
  });

  // ===========================================================================
  // 0.5.11: session_auto_commit config (issue #245 + screenshot user)
  // ===========================================================================

  function writeConfigYaml(content: string): void {
    writeFile(".trellis/config.yaml", content);
  }

  it("[session_auto_commit=false] task.py archive skips git entirely", () => {
    setupRepo({ gitignoreTrellis: false });
    writeConfigYaml("session_auto_commit: false\n");

    writeFile(
      ".trellis/tasks/issue-600/task.json",
      JSON.stringify(
        {
          id: "issue-600",
          name: "issue-600",
          lifecycle_generation: 0,
          title: "Test archive",
          status: "in_progress",
          package: null,
        },
        null,
        2,
      ),
    );
    writeFile(".trellis/tasks/issue-600/prd.md", "# PRD\n");

    const taskScriptPath = path.join(tmpDir, ".trellis", "scripts", "task.py");
    const result = spawnSync(pyCmd, [taskScriptPath, "archive", "issue-600"], {
      cwd: tmpDir,
      encoding: "utf-8",
      env: { ...process.env, TRELLIS_CONTEXT_ID: "session-arch-2" },
    });
    const stderr = result.stderr ?? "";
    expect(stderr).not.toContain("Auto-committed");
    expect(stderr).toContain("task_auto_commit: false");

    const log = execSync("git log --oneline", {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(log.trim().split("\n").length).toBe(1);

    // Archive directory move still happened on disk.
    const archiveExists = fs
      .readdirSync(path.join(tmpDir, ".trellis/tasks/archive"))
      .some((monthDir) => {
        const monthPath = path.join(tmpDir, ".trellis/tasks/archive", monthDir);
        return (
          fs.statSync(monthPath).isDirectory() &&
          fs.existsSync(path.join(monthPath, "issue-600"))
        );
      });
    expect(archiveExists).toBe(true);
  });
});

// =============================================================================
// regression: transient .git/index.lock during archive auto-commit
// =============================================================================
//
// `task.py archive` moves the task directory on disk BEFORE it stages and
// commits. Another process holding `.git/index.lock` for a fraction of a
// second (IDE git integration, status daemon, a parallel session) made that
// auto-commit fail outright, leaving the user with a completed move and a git
// error to untangle.
//
// Fix: `run_git_retry_index_lock` retries ONLY index.lock failures — three
// attempts over ~1.5s — and the archive path uses it for `add`,
// `rm --cached` and `commit`. When the retries run out the move stays
// complete and the commit is reported as pending: rolling the move back would
// also have to undo the completed status, the re-parented children and the
// cleared sessions, and a partial rollback is worse than a named pending
// commit. The warning names the lock file and the command to run by hand.
// =============================================================================

describe("regression: bounded index.lock retry on archive auto-commit", () => {
  let tmpDir: string;
  const pyCmd = process.platform === "win32" ? "python" : "python3";
  const taskName = "issue-lock";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-index-lock-"));
    execSync("git init -q -b main", { cwd: tmpDir });
    execSync('git config user.email "test@trellis.local"', { cwd: tmpDir });
    execSync('git config user.name "Trellis Test"', { cwd: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeFile(rel: string, content: string): void {
    const abs = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  }

  function lockFile(): string {
    return path.join(tmpDir, ".git", "index.lock");
  }

  function setupRepo(): void {
    const scriptsDir = path.join(tmpDir, ".trellis", "scripts");
    for (const [rel, content] of getAllScripts()) {
      const abs = path.join(scriptsDir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
    }
    writeFile(
      ".trellis/.developer",
      "name=test-dev\ninitialized_at=2026-08-09T00:00:00\n",
    );
    writeFile(
      `.trellis/tasks/${taskName}/task.json`,
      JSON.stringify(
        {
          id: taskName,
          name: taskName,
          lifecycle_generation: 0,
          title: "Locked archive",
          status: "in_progress",
          package: null,
        },
        null,
        2,
      ),
    );
    writeFile(`.trellis/tasks/${taskName}/prd.md`, "# PRD\n");
    writeFile("README.md", "test\n");
    // The task must be tracked: an untracked task dir makes a failed
    // auto-commit inconsequential, which is not the case under test.
    execSync("git add -A", { cwd: tmpDir });
    execSync('git commit -q -m "init"', { cwd: tmpDir });
  }

  function runArchive(): { status: number | null; stderr: string } {
    const taskScriptPath = path.join(tmpDir, ".trellis", "scripts", "task.py");
    const result = spawnSync(pyCmd, [taskScriptPath, "archive", taskName], {
      cwd: tmpDir,
      encoding: "utf-8",
      env: { ...process.env, TRELLIS_CONTEXT_ID: "session-lock" },
    });
    return { status: result.status, stderr: result.stderr ?? "" };
  }

  function archivedTaskExists(): boolean {
    const archiveRoot = path.join(tmpDir, ".trellis/tasks/archive");
    if (!fs.existsSync(archiveRoot)) return false;
    return fs.readdirSync(archiveRoot).some((monthDir) => {
      const monthPath = path.join(archiveRoot, monthDir);
      return (
        fs.statSync(monthPath).isDirectory() &&
        fs.existsSync(path.join(monthPath, taskName))
      );
    });
  }

  function gitLogLines(): string[] {
    return execSync("git log --oneline", { cwd: tmpDir, encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
  }

  it("[index-lock] retries only index.lock failures, bounded by the attempt count", () => {
    // Deterministic cover for the retry semantics themselves: the end-to-end
    // tests below depend on wall-clock timing, this one does not.
    setupRepo();
    const probe = `
import json
import sys
from pathlib import Path

root = Path.cwd()
sys.path.insert(0, str(root / ".trellis" / "scripts"))
import common.git as g

# Real backoff would make this probe sleep for its whole runtime.
g.INDEX_LOCK_RETRY_BACKOFF = (0, 0)
lock_err = "fatal: Unable to create '/repo/.git/index.lock': File exists."
calls = []

def transient(args, cwd=None, timeout=None):
    calls.append(args)
    if len(calls) < g.INDEX_LOCK_RETRY_ATTEMPTS:
        return 1, "", lock_err
    return 0, "done", ""

def stuck(args, cwd=None, timeout=None):
    calls.append(args)
    return 1, "", lock_err

def unrelated(args, cwd=None, timeout=None):
    calls.append(args)
    return 1, "", "fatal: pathspec 'nope' did not match any files"

g.run_git = transient
transient_rc, transient_out, _ = g.run_git_retry_index_lock(["commit", "-m", "x"])
transient_calls = len(calls)

calls.clear()
g.run_git = stuck
stuck_rc, _, stuck_err = g.run_git_retry_index_lock(["commit", "-m", "x"])
stuck_calls = len(calls)

calls.clear()
g.run_git = unrelated
unrelated_rc, _, _ = g.run_git_retry_index_lock(["add", "nope"])
unrelated_calls = len(calls)

print(json.dumps({
    "attempts": g.INDEX_LOCK_RETRY_ATTEMPTS,
    "transient_rc": transient_rc,
    "transient_out": transient_out,
    "transient_calls": transient_calls,
    "stuck_rc": stuck_rc,
    "stuck_calls": stuck_calls,
    "stuck_named_lock": g.stderr_indicates_index_lock(stuck_err),
    "unrelated_rc": unrelated_rc,
    "unrelated_calls": unrelated_calls,
}))
`;
    const result = spawnSync(pyCmd, ["-c", probe], {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      attempts: 3,
      // A lock released before the last attempt ends in success.
      transient_rc: 0,
      transient_out: "done",
      transient_calls: 3,
      // A lock that never clears stops at the bound instead of hanging.
      stuck_rc: 1,
      stuck_calls: 3,
      stuck_named_lock: true,
      // Anything that is not a lock failure must not be retried — looping
      // over a real error only delays it.
      unrelated_rc: 1,
      unrelated_calls: 1,
    });
  });

  it("[index-lock] archive survives a lock that is released mid-retry", () => {
    setupRepo();
    fs.writeFileSync(lockFile(), "", "utf-8");

    // Released after the first attempt is certain to have hit the lock, but
    // before the retry window (~1.5s from that first attempt) closes.
    const releaser = spawn(
      pyCmd,
      [
        "-c",
        `import os, time; time.sleep(1.2); os.path.exists(${JSON.stringify(
          lockFile(),
        )}) and os.remove(${JSON.stringify(lockFile())})`,
      ],
      { stdio: "ignore" },
    );
    releaser.unref();

    const { status, stderr } = runArchive();

    expect(status, stderr).toBe(0);
    expect(stderr).toContain("Auto-committed");
    expect(archivedTaskExists()).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".trellis/tasks", taskName))).toBe(
      false,
    );

    const log = gitLogLines();
    expect(log.length).toBe(2);
    expect(log[0]).toContain(`chore(task): archive ${taskName}`);

    // The move is fully recorded — no phantom deletes left behind for the
    // source path.
    const dirty = execSync("git status --porcelain", {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(dirty).not.toContain(`.trellis/tasks/${taskName}/`);
  });

  it("[index-lock] a lock that never clears aborts with a diagnostic naming it", () => {
    setupRepo();
    fs.writeFileSync(lockFile(), "", "utf-8");

    const { status, stderr } = runArchive();

    // Failure, not a misleading success.
    expect(status, stderr).toBe(1);
    expect(stderr).toContain("index.lock");
    expect(stderr).toContain("another process is holding");
    expect(stderr).toContain("gave up after 3 attempts");
    // Says what is left to do, so neither a user nor an agent reading the
    // log has to guess.
    expect(stderr).toContain("only the commit is pending");
    expect(stderr).toContain(
      `git commit -m "chore(task): archive ${taskName}"`,
    );
    expect(stderr).toContain("Archive moved on disk");

    // Consistent state: the move completed, nothing is half-moved.
    expect(archivedTaskExists()).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".trellis/tasks", taskName))).toBe(
      false,
    );

    // Nothing was committed — the pending commit is genuinely pending.
    fs.rmSync(lockFile(), { force: true });
    expect(gitLogLines().length).toBe(1);
    const dirty = execSync("git status --porcelain", {
      cwd: tmpDir,
      encoding: "utf-8",
    });
    expect(dirty).toContain(`.trellis/tasks/${taskName}/`);
  });
});

// =============================================================================
// regression: dogfood ↔ shipped Python script parity
// =============================================================================

describe("regression: .trellis/scripts stays byte-identical to templates/trellis/scripts", () => {
  // `.trellis/scripts/` is Trellis's own dogfood copy;
  // `packages/cli/src/templates/trellis/scripts/` is what ships to users.
  // They are two physical copies of the same 28 files and nothing enforced
  // parity, so one-sided edits landed silently — PR #390 changed the template's
  // `common/session_context.py` upgrade hint and left the dogfood copy on the
  // old wording for a month. This test turns that whole class of drift into a
  // build failure.
  const __dirnameParity = path.dirname(fileURLToPath(import.meta.url));
  const parityRepoRoot = path.resolve(__dirnameParity, "../../..");
  const dogfoodScriptsRoot = path.join(parityRepoRoot, ".trellis", "scripts");
  const templateScriptsRoot = path.join(
    parityRepoRoot,
    "packages/cli/src/templates/trellis/scripts",
  );

  function listPyFiles(root: string): string[] {
    const found: string[] = [];
    function walk(dir: string, prefix: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (entry.name === "__pycache__") continue;
          walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".py")) {
          found.push(`${prefix}${entry.name}`);
        }
      }
    }
    walk(root, "");
    return found.sort();
  }

  const templateFiles = listPyFiles(templateScriptsRoot);

  it("both trees hold the same set of .py files", () => {
    const dogfoodFiles = listPyFiles(dogfoodScriptsRoot);
    expect(
      dogfoodFiles,
      "`.trellis/scripts/` and `packages/cli/src/templates/trellis/scripts/` " +
        "must hold the same .py files — a script added to (or deleted from) " +
        "one tree must be mirrored in the other.",
    ).toEqual(templateFiles);
  });

  for (const relativePath of templateFiles) {
    it(`${relativePath} is byte-identical in both trees`, () => {
      const dogfoodPath = path.join(dogfoodScriptsRoot, relativePath);
      expect(
        fs.existsSync(dogfoodPath),
        `.trellis/scripts/${relativePath} is missing (template has it)`,
      ).toBe(true);
      const dogfoodBytes = fs.readFileSync(dogfoodPath);
      const templateBytes = fs.readFileSync(
        path.join(templateScriptsRoot, relativePath),
      );
      expect(
        dogfoodBytes.equals(templateBytes),
        `.trellis/scripts/${relativePath} has drifted from ` +
          `packages/cli/src/templates/trellis/scripts/${relativePath}. ` +
          `Edit both copies, never one.`,
      ).toBe(true);
    });
  }
});

describe("regression: compat alias must not win platform detection", () => {
  // CodeBuddy, ZCode and Trae all set CLAUDE_PROJECT_DIR beside their own
  // variable. `_detect_platform` walks the map in insertion order, so a
  // CLAUDE_PROJECT_DIR entry placed before the vendor keys detects every one
  // of those hosts as `claude`. The context key then becomes
  // `claude_<their-session-id>`, which never matches the session file
  // `task.py start` wrote under the host's real name — every turn reports
  // no_task while the pointer sits on disk.
  //
  // Observed on CodeBuddy IDE 4.10.4: `codebuddy_ae54840e….json` in
  // .trellis/.runtime/sessions/ next to `update-check-claude_ae54840e….marker`
  // — same session id, two different platform prefixes.
  const HOOKS_WITH_DETECTION = ["inject-workflow-state.py", "session-start.py"];

  for (const hook of HOOKS_WITH_DETECTION) {
    it(`${hook} checks CLAUDE_PROJECT_DIR after every vendor key`, () => {
      const source = fs.readFileSync(
        path.join(
          path.resolve(__dirname, ".."),
          "src/templates/shared-hooks",
          hook,
        ),
        "utf-8",
      );
      const block = /env_map\s*=\s*\{([\s\S]*?)\}/.exec(source);
      expect(block, `${hook}: no env_map found`).not.toBeNull();

      const keys = [
        ...(block?.[1] ?? "").matchAll(/"([A-Z_]+_PROJECT_DIR)"/g),
      ].map((m) => m[1]);
      expect(keys.length).toBeGreaterThan(3);
      expect(
        keys.indexOf("CLAUDE_PROJECT_DIR"),
        `${hook}: CLAUDE_PROJECT_DIR is a compat alias several hosts also set; ` +
          `it must be checked last or they are all detected as claude`,
      ).toBe(keys.length - 1);
    });
  }
});

describe("regression: task.py rename rewrites every reference in one pass", () => {
  // Renaming a task used to be a hand-edited multi-file operation (directory
  // name, task.json identity fields, parent/children back-references, jsonl
  // context paths), and a partial hand-rename left dangling references that
  // preflight gates reject later.
  const pyCmd = process.platform === "win32" ? "python" : "python3";
  const pad = (n: number): string => String(n).padStart(2, "0");
  const now = new Date();
  const datePrefix = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const yearMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-task-rename-"));
    for (const [rel, content] of getAllScripts()) {
      const abs = path.join(tmpDir, ".trellis", "scripts", rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
    }
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", ".developer"),
      "name=test-dev\ninitialized_at=2026-08-09T00:00:00\n",
    );
    fs.mkdirSync(taskDir("archive"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function runTask(...args: string[]): {
    status: number | null;
    stdout: string;
    stderr: string;
  } {
    const proc = spawnSync(
      pyCmd,
      [path.join(".trellis", "scripts", "task.py"), ...args],
      { cwd: tmpDir, encoding: "utf-8" },
    );
    return {
      status: proc.status,
      stdout: proc.stdout ?? "",
      stderr: proc.stderr ?? "",
    };
  }

  function taskDir(...segments: string[]): string {
    return path.join(tmpDir, ".trellis", "tasks", ...segments);
  }

  function readTaskJson(name: string): Record<string, unknown> {
    return JSON.parse(
      fs.readFileSync(path.join(taskDir(name), "task.json"), "utf-8"),
    ) as Record<string, unknown>;
  }

  function create(slug: string, parent?: string): string {
    const args = [
      "create",
      "--creator",
      "fixture-creator",
      "--assignee",
      "test-dev",
      slug,
      "--description",
      "rename fixture",
      "--slug",
      slug,
      "--no-start",
    ];
    if (parent) args.push("--parent", parent);
    const r = runTask(...args);
    expect(r.status, r.stderr).toBe(0);
    return `${datePrefix}-${slug}`;
  }

  /** Every `<file>:<line>` under .trellis/tasks/ that still names `taskName`. */
  function scanForName(taskName: string): string[] {
    const pattern = new RegExp(
      `(?<![0-9A-Za-z_-])${taskName}(?![0-9A-Za-z_-])`,
    );
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(abs);
          if (pattern.test(entry.name)) hits.push(`${abs}/ (directory name)`);
          continue;
        }
        const lines = fs.readFileSync(abs, "utf-8").split("\n");
        lines.forEach((line, index) => {
          if (pattern.test(line)) hits.push(`${abs}:${index + 1}`);
        });
      }
    };
    walk(taskDir());
    return hits;
  }

  it("[task-rename] a task with a parent and two children leaves no dangling reference", () => {
    const parent = create("mum");
    const target = create("target", parent);
    const childA = create("kid-a", target);
    const childB = create("kid-b", target);

    const r = runTask("rename", target, "renamed");
    expect(r.status, r.stderr).toBe(0);

    const renamed = `${datePrefix}-renamed`;
    expect(fs.existsSync(taskDir(target))).toBe(false);
    expect(fs.existsSync(taskDir(renamed))).toBe(true);

    // Stable identity is preserved; mutable TaskRef fields and back-references
    // carry the renamed value.
    expect(readTaskJson(renamed).id).toBe("target");
    expect(readTaskJson(renamed).name).toBe("renamed");
    expect(readTaskJson(renamed).lifecycle_generation).toBe(0);
    expect(readTaskJson(renamed).parent).toBe(parent);
    expect(readTaskJson(parent).children).toEqual([renamed]);
    expect(readTaskJson(childA).parent).toBe(renamed);
    expect(readTaskJson(childB).parent).toBe(renamed);

    expect(scanForName(target)).toEqual([]);
  });

  it("[task-rename] legacy subtasks back-references are rewritten too", () => {
    const parent = create("mum");
    const target = create("target", parent);

    const parentJson = readTaskJson(parent);
    parentJson.subtasks = [target];
    fs.writeFileSync(
      path.join(taskDir(parent), "task.json"),
      JSON.stringify(parentJson, null, 2) + "\n",
    );

    const r = runTask("rename", target, "renamed");
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("subtasks[0]");
    expect(readTaskJson(parent).subtasks).toEqual([`${datePrefix}-renamed`]);
    expect(scanForName(target)).toEqual([]);
  });

  it("[task-rename] --dry-run prints the change set it would apply, and writes nothing", () => {
    const parent = create("mum");
    const target = create("target", parent);
    create("kid", target);
    fs.writeFileSync(
      path.join(taskDir(target), "implement.jsonl"),
      `{"file": ".trellis/tasks/${target}/research.md", "reason": "findings"}\n`,
    );
    fs.writeFileSync(
      path.join(tmpDir, ".trellis", "workflow.md"),
      `The plan is tracked in ${target}.\n`,
    );

    const dry = runTask("rename", target, "renamed", "--dry-run");
    expect(dry.status, dry.stderr).toBe(0);
    expect(dry.stderr).toContain("Dry run: nothing was written");
    expect(fs.existsSync(taskDir(target))).toBe(true);
    expect(fs.existsSync(taskDir(`${datePrefix}-renamed`))).toBe(false);
    expect(readTaskJson(target).id).toBe("target");
    expect(readTaskJson(parent).children).toEqual([target]);

    const applied = runTask("rename", target, "renamed");
    expect(applied.status, applied.stderr).toBe(0);

    // The whole point of the dry run: what it printed is what the real run did.
    expect(applied.stdout).toBe(dry.stdout);
    expect(dry.stdout).toContain(
      `dir: .trellis/tasks/${target} -> .trellis/tasks/${datePrefix}-renamed`,
    );
    expect(dry.stdout).toContain("task.json: name: target -> renamed");
    expect(dry.stdout).toContain("sessions: unchanged");
    expect(dry.stdout).toContain(
      `backref: .trellis/tasks/${parent}/task.json: children[0]: ${target} -> ${datePrefix}-renamed`,
    );
    expect(dry.stdout).toContain(
      `jsonl: .trellis/tasks/${target}/implement.jsonl:1:`,
    );
    // References outside the task dir are reported, never rewritten.
    expect(dry.stdout).toContain(
      "reported (not rewritten): .trellis/workflow.md:1",
    );
    expect(
      fs.readFileSync(path.join(tmpDir, ".trellis", "workflow.md"), "utf-8"),
    ).toContain(target);
  });

  it("[task-rename] jsonl paths under the task dir move, a sibling's do not", () => {
    const target = create("target");
    const sibling = create("target-other");
    fs.writeFileSync(
      path.join(taskDir(target), "check.jsonl"),
      [
        `{"file": ".trellis/tasks/${target}/research.md", "reason": "findings"}`,
        `{"file": ".trellis/spec/guides/style.md", "reason": "spec"}`,
        `{"file": ".trellis/tasks/${sibling}/notes.md", "reason": "sibling"}`,
        "",
      ].join("\n"),
    );

    expect(runTask("rename", target, "renamed").status).toBe(0);

    const renamed = `${datePrefix}-renamed`;
    const after = fs.readFileSync(
      path.join(taskDir(renamed), "check.jsonl"),
      "utf-8",
    );
    expect(after).toContain(`".trellis/tasks/${renamed}/research.md"`);
    expect(after).toContain('".trellis/spec/guides/style.md"');
    // `target` is a prefix of `target-other`; the sibling must survive intact.
    expect(after).toContain(`".trellis/tasks/${sibling}/notes.md"`);
  });

  it("[task-rename] refuses an existing destination, an archived name, a bad slug and an unknown task", () => {
    const other = create("other");
    const target = create("target");

    const occupied = runTask("rename", target, "other");
    expect(occupied.status).not.toBe(0);
    expect(occupied.stderr).toContain(`Task already exists: ${other}`);
    expect(fs.existsSync(taskDir(target))).toBe(true);

    fs.mkdirSync(taskDir("archive", yearMonth, `${datePrefix}-gone`), {
      recursive: true,
    });
    const archived = runTask("rename", target, "gone");
    expect(archived.status).not.toBe(0);
    expect(archived.stderr).toContain(
      `Task already archived: ${datePrefix}-gone`,
    );

    const badSlug = runTask("rename", target, "../evil");
    expect(badSlug.status).not.toBe(0);
    expect(badSlug.stderr).toContain("must be a plain name");

    const unknown = runTask("rename", "no-such-task", "renamed");
    expect(unknown.status).not.toBe(0);

    // Every refusal is pre-flight: the task is still exactly where it was.
    expect(fs.existsSync(taskDir(target))).toBe(true);
    expect(readTaskJson(target).id).toBe("target");
  });

  it("[task-rename] refuses a slug carrying a date prefix, normalizing only its own", () => {
    const target = create("target");

    const wrongDate = runTask("rename", target, "01-02-renamed");
    expect(wrongDate.status).not.toBe(0);
    expect(wrongDate.stderr).toContain("keeps the task's own creation date");

    // The task's own prefix pasted back in is a slip, not a request for
    // MM-DD-MM-DD-slug (the create-side bug in #377).
    const ownDate = runTask("rename", target, `${datePrefix}-renamed`);
    expect(ownDate.status, ownDate.stderr).toBe(0);
    expect(ownDate.stderr).toContain("should not include the MM-DD prefix");
    expect(fs.existsSync(taskDir(`${datePrefix}-renamed`))).toBe(true);
  });

  it("[issue-8] rename preserves session bytes and resolves through TaskId", () => {
    const target = create("target");
    create("bystander");
    const sessionsDir = path.join(tmpDir, ".trellis", ".runtime", "sessions");
    fs.mkdirSync(sessionsDir, { recursive: true });
    const sessionFile = path.join(sessionsDir, "sess-a.json");
    const bystanderFile = path.join(sessionsDir, "sess-b.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        schema_version: 2,
        task_id: "target",
        lifecycle_generation: 0,
      }),
      "utf-8",
    );
    fs.writeFileSync(
      bystanderFile,
      JSON.stringify({
        schema_version: 2,
        task_id: "bystander",
        lifecycle_generation: 0,
      }),
      "utf-8",
    );
    const before = fs.readFileSync(sessionFile, "utf-8");

    const r = runTask("rename", target, "renamed");
    expect(r.status, r.stderr).toBe(0);

    expect(fs.readFileSync(sessionFile, "utf-8")).toBe(before);
    // A session on a different task is left exactly as it was.
    expect(JSON.parse(fs.readFileSync(bystanderFile, "utf-8")).task_id).toBe(
      "bystander",
    );
  });

  it("[task-rename] refuses to rename an archived task", () => {
    const target = create("target");
    expect(runTask("archive", target, "--no-commit").status).toBe(0);

    const r = runTask(
      "rename",
      path.posix.join(".trellis", "tasks", "archive", yearMonth, target),
      "renamed",
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("invalid_task_path: not an active task");
    expect(
      fs.existsSync(taskDir("archive", yearMonth, target, "task.json")),
    ).toBe(true);
  });
});
