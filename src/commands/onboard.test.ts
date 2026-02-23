import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { captureOutput } from "../test-helpers";
import { onboard } from "./onboard";
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("onboard", () => {
  const tmpDir = join(tmpdir(), "stage-cli-test-onboard");
  const originalCwd = process.cwd;

  beforeEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    mkdirSync(tmpDir, { recursive: true });
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("creates CLAUDE.md with stage instructions", async () => {
    captureOutput();

    await onboard([], {});

    const content = readFileSync(join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("<stage>");
    expect(content).toContain("stage new");
    expect(content).toContain("--session");
  });

  test("appends to existing CLAUDE.md", async () => {
    writeFileSync(join(tmpDir, "CLAUDE.md"), "# My Project\n\nExisting content.");
    captureOutput();

    await onboard([], {});

    const content = readFileSync(join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("# My Project");
    expect(content).toContain("Existing content.");
    expect(content).toContain("<stage>");
  });

  test("uses AGENTS.md if it exists and CLAUDE.md does not", async () => {
    writeFileSync(join(tmpDir, "AGENTS.md"), "# Agents");
    captureOutput();

    await onboard([], {});

    expect(existsSync(join(tmpDir, "CLAUDE.md"))).toBe(false);
    const content = readFileSync(join(tmpDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("# Agents");
    expect(content).toContain("<stage>");
  });

  test("prefers CLAUDE.md over AGENTS.md", async () => {
    writeFileSync(join(tmpDir, "CLAUDE.md"), "# Claude");
    writeFileSync(join(tmpDir, "AGENTS.md"), "# Agents");
    captureOutput();

    await onboard([], {});

    const claude = readFileSync(join(tmpDir, "CLAUDE.md"), "utf-8");
    const agents = readFileSync(join(tmpDir, "AGENTS.md"), "utf-8");
    expect(claude).toContain("<stage>");
    expect(agents).not.toContain("<stage>");
  });

  test("skips if already onboarded", async () => {
    writeFileSync(join(tmpDir, "CLAUDE.md"), "stuff\n<stage>\nalready here");
    const { logs } = captureOutput();

    await onboard([], {});

    expect(logs.some((l) => l.includes("Already onboarded"))).toBe(true);
  });

  test("json mode returns file path", async () => {
    const { logs } = captureOutput();

    await onboard([], { json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.success).toBe(true);
    expect(parsed.file).toContain("CLAUDE.md");
  });

  test("json mode shows already_onboarded", async () => {
    writeFileSync(join(tmpDir, "CLAUDE.md"), "<stage>");
    const { logs } = captureOutput();

    await onboard([], { json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.message).toBe("already_onboarded");
  });
});
