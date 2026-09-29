import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("figlet", () => ({ default: { textSync: vi.fn(() => "TRELLIS") } }));
vi.mock("inquirer", () => ({ default: { prompt: vi.fn().mockResolvedValue({}) } }));
vi.mock("node:child_process", () => ({
  execSync: vi.fn((command: string) => command.endsWith(" --version") ? "Python 3.11.12" : ""),
}));

import { execSync } from "node:child_process";
import { init } from "../../src/commands/init.js";

describe("init task bootstrap and historical preservation", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-init-ownership-"));
    vi.spyOn(process, "cwd").mockReturnValue(root);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(process, "exit").mockImplementation((code) => { throw new Error(`exit:${code}`); });
    vi.mocked(execSync).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("rejects retired user option before writes", async () => {
    await expect(init({ yes: true, user: "alice" })).rejects.toThrow("exit:2");
    expect(fs.readdirSync(root)).toEqual([]);
  });

  it("creates bootstrap without personnel fields or workspace", async () => {
    await init({ yes: true, codex: true });
    const task = JSON.parse(fs.readFileSync(path.join(root, ".trellis/tasks/00-bootstrap-guidelines/task.json"), "utf8"));
    expect(task).not.toHaveProperty("creator");
    expect(task).not.toHaveProperty("assignee");
    expect(fs.existsSync(path.join(root, ".trellis/.developer"))).toBe(false);
    expect(fs.existsSync(path.join(root, ".trellis/workspace"))).toBe(false);
    expect(fs.existsSync(path.join(root, ".gitattributes"))).toBe(false);
    for (const retired of ["init_developer.py", "get_developer.py", "add_session.py", "__pycache__"]) {
      expect(fs.existsSync(path.join(root, ".trellis/scripts", retired))).toBe(false);
    }
    expect(fs.existsSync(path.join(root, ".trellis/scripts/hooks/linear_sync.py"))).toBe(true);
    expect(vi.mocked(execSync).mock.calls.some(([cmd]) => String(cmd).includes("git config user.name"))).toBe(false);
    expect(vi.mocked(execSync).mock.calls.some(([cmd]) => String(cmd).includes("init_developer"))).toBe(false);
  });

  it.each([undefined, "old-a", "old-b"])("does not infer onboarding from historical identity %s", async (identity) => {
    fs.mkdirSync(path.join(root, ".trellis/tasks/archive"), { recursive: true });
    fs.mkdirSync(path.join(root, ".trellis/workspace/old"), { recursive: true });
    const journal = path.join(root, ".trellis/workspace/old/journal-1.md");
    const index = path.join(root, ".trellis/workspace/index.md");
    fs.writeFileSync(journal, "Historical record\r\n");
    fs.writeFileSync(index, "Historical index\n");
    const identityFile = path.join(root, ".trellis/.developer");
    if (identity) fs.writeFileSync(identityFile, `name=${identity}\n`);
    vi.stubEnv("TRELLIS_DEVELOPER", "ignored-caller");
    await init({ yes: true, codex: true, force: true });
    expect(fs.readdirSync(path.join(root, ".trellis/tasks"))).toEqual(["archive"]);
    expect(fs.readFileSync(journal, "utf8")).toBe("Historical record\r\n");
    expect(fs.readFileSync(index, "utf8")).toBe("Historical index\n");
    expect(fs.existsSync(identityFile)).toBe(identity !== undefined);
    if (identity) expect(fs.readFileSync(identityFile, "utf8")).toBe(`name=${identity}\n`);
  });

  it("repeated initialization preserves bootstrap metadata", async () => {
    await init({ yes: true, codex: true });
    const file = path.join(root, ".trellis/tasks/00-bootstrap-guidelines/task.json");
    const before = fs.readFileSync(file);
    await init({ yes: true, codex: true, force: true });
    expect(fs.readFileSync(file)).toEqual(before);
    expect(fs.readdirSync(path.dirname(path.dirname(file)))).toEqual(["00-bootstrap-guidelines"]);
  });

  it("retains user merge attributes without provisioning a journal rule", async () => {
    const file = path.join(root, ".gitattributes");
    fs.writeFileSync(file, "*.txt text\n");
    await init({ yes: true, codex: true });
    expect(fs.readFileSync(file, "utf8")).toBe("*.txt text\n");
  });

  it("rejects incompatible existing workflow before adding a platform", async () => {
    fs.mkdirSync(path.join(root, ".trellis/tasks/archive"), { recursive: true });
    const workflow = path.join(root, ".trellis/workflow.md");
    const original = "Run python3 .trellis/scripts/init_developer.py alice\n";
    fs.writeFileSync(workflow, original);
    await expect(init({ yes: true, codex: true })).rejects.toThrow(/Existing workflow/);
    expect(fs.existsSync(path.join(root, ".codex"))).toBe(false);
    expect(fs.existsSync(path.join(root, ".trellis/.template-hashes.json"))).toBe(false);
    expect(fs.readFileSync(workflow, "utf8")).toBe(original);
    expect(fs.readdirSync(path.join(root, ".trellis/tasks"))).toEqual(["archive"]);
  });
});
