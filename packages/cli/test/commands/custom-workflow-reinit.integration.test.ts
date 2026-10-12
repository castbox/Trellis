import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("figlet", () => ({ default: { textSync: vi.fn(() => "TRELLIS") } }));
vi.mock("inquirer", () => ({
  default: { prompt: vi.fn().mockResolvedValue({ proceed: true }) },
}));
vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execSync: vi.fn((cmd: string) =>
      cmd.endsWith(" --version") ? "Python 3.11.12" : "",
    ),
  };
});

import { init } from "../../src/commands/init.js";
import { update } from "../../src/commands/update.js";
import { PATHS } from "../../src/constants/paths.js";
import { loadHashes } from "../../src/utils/template-hash.js";
import { readDeliveryWorkflowContract } from "../../src/utils/delivery-workflow.js";
import { replacePythonCommandLiterals } from "../../src/configurators/shared.js";
import {
  deliveryWorkflowMdTemplate,
  workflowMdTemplate,
} from "../../src/templates/trellis/index.js";

const CUSTOM_CONTINUATION = "CUSTOM-WORKFLOW-OWNER-CONTINUATION\n";
const CUSTOM_LEGACY = [
  "# User-owned legacy workflow",
  "## Phase Index",
  "Custom owner plans and implements this project.",
  "[trellis-continuation]",
  CUSTOM_CONTINUATION.trimEnd(),
  "[/trellis-continuation]",
  "",
].join("\n");
const CUSTOM_DELIVERY = deliveryWorkflowMdTemplate
  .replace(/"trellis-([a-z-]+)"/g, '"custom-$1"')
  .replace(
    /^\[trellis-continuation\]\n[\s\S]*?^\[\/trellis-continuation\]/m,
    `[trellis-continuation]\n${CUSTOM_CONTINUATION}[/trellis-continuation]`,
  );

const WORKFLOWS = [
  {
    name: "legacy",
    content: CUSTOM_LEGACY,
    bundledId: "native",
    bundled: workflowMdTemplate,
  },
  {
    name: "Delivery v2",
    content: CUSTOM_DELIVERY,
    bundledId: "native-delivery-v1",
    bundled: deliveryWorkflowMdTemplate,
  },
];

describe("user-managed workflow ownership across reinit and update", () => {
  let cwd: string;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-custom-reinit-"));
    vi.spyOn(process, "cwd").mockReturnValue(cwd);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  async function installCustom(content: string): Promise<void> {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith("/index.json")) {
          return new Response(
            JSON.stringify({
              version: 1,
              templates: [
                {
                  id: "custom",
                  type: "workflow",
                  name: "Custom",
                  path: "workflows/custom/workflow.md",
                },
              ],
            }),
          );
        }
        return new Response(content);
      }),
    );
    await init({
      yes: true,
      workflow: "custom",
      workflowSource: "gh:example/workflows",
    });
  }

  function assertCustomPreserved(content: string): void {
    const written = fs.readFileSync(
      path.join(cwd, PATHS.WORKFLOW_GUIDE_FILE),
      "utf8",
    );
    expect(written).toBe(replacePythonCommandLiterals(content));
    expect(loadHashes(cwd)[PATHS.WORKFLOW_GUIDE_FILE]).toBeUndefined();
    const contract = readDeliveryWorkflowContract(content);
    expect(readDeliveryWorkflowContract(written)?.owners).toEqual(
      contract?.owners,
    );
    const python = process.platform === "win32" ? "python" : "python3";
    const projection = spawnSync(
      python,
      [
        "-B",
        path.join(cwd, ".trellis/scripts/get_context.py"),
        "--mode",
        "continuation",
      ],
      { cwd, encoding: "utf8" },
    );
    expect(projection.status, projection.stderr).toBe(0);
    expect(projection.stdout).toBe(CUSTOM_CONTINUATION);
    if (contract) {
      const runtime = spawnSync(
        python,
        [
          "-B",
          path.join(cwd, ".trellis/scripts/get_context.py"),
          "--mode",
          "runtime-contract",
        ],
        { cwd, encoding: "utf8" },
      );
      expect(runtime.status, runtime.stderr).toBe(0);
      expect(JSON.parse(runtime.stdout)).toEqual(contract);
    }
  }

  it.each(WORKFLOWS)(
    "preserves custom $name through forced reinit and normal/forced update",
    async ({ content }) => {
      await installCustom(content);
      assertCustomPreserved(content);
      await init({ yes: true, force: true });
      assertCustomPreserved(content);
      await update({});
      assertCustomPreserved(content);
      await update({ force: true });
      assertCustomPreserved(content);
    },
  );

  it.each(WORKFLOWS)(
    "preserves custom $name through add-platform reinit and update",
    async ({ content }) => {
      await installCustom(content);
      await init({ yes: true, cursor: true });
      expect(fs.existsSync(path.join(cwd, ".cursor"))).toBe(true);
      assertCustomPreserved(content);
      await update({ force: true });
      assertCustomPreserved(content);
    },
  );

  it.each(WORKFLOWS)(
    "explicit forced --workflow transfers custom $name to the bundled owner",
    async ({ content, bundledId, bundled }) => {
      await installCustom(content);
      await init({ yes: true, force: true, workflow: bundledId });
      const written = fs.readFileSync(
        path.join(cwd, PATHS.WORKFLOW_GUIDE_FILE),
        "utf8",
      );
      expect(written).toBe(replacePythonCommandLiterals(bundled));
      expect(loadHashes(cwd)[PATHS.WORKFLOW_GUIDE_FILE]).toBeDefined();
      await update({ force: true });
      expect(
        fs.readFileSync(path.join(cwd, PATHS.WORKFLOW_GUIDE_FILE), "utf8"),
      ).toBe(written);
    },
  );
});
