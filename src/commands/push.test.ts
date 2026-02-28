import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { captureOutput } from "../test-helpers";
import { push } from "./push";
import { setConvexConfig } from "../convex-client";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("push", () => {
  const originalFetch = globalThis.fetch;
  const originalExit = process.exit;
  let tempDir: string;

  beforeEach(() => {
    setConvexConfig({ url: "http://localhost:3210", isSelfHosted: true });
    process.exit = (() => { throw new Error("EXIT"); }) as any;
    tempDir = mkdtempSync(join(tmpdir(), "stage-test-"));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.exit = originalExit;
    rmSync(tempDir, { recursive: true });
  });

  function mockConvexCalls() {
    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      // writeFile calls return version info
      // triggerRender returns entry/version
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: "success",
          value: callCount <= 2 
            ? { path: "/app/test.tsx", version: 1, size: 10 }
            : { entry: "/app/App.tsx", version: 1 }
        }),
      });
    }) as any;
  }

  test("pushes directory and renders", async () => {
    writeFileSync(join(tempDir, "App.tsx"), "content1");
    writeFileSync(join(tempDir, "Button.tsx"), "content2");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(tempDir, "/app", { session: "abc123", render: true });

    expect(logs.some((l) => l.includes("2 files"))).toBe(true);
    expect(logs.some((l) => l.includes("Rendered"))).toBe(true);
  });

  test("pushes single file", async () => {
    const file = join(tempDir, "test.tsx");
    writeFileSync(file, "content");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(file, "/app", { session: "abc123", render: true });

    expect(logs.some((l) => l.includes("1 file"))).toBe(true);
  });

  test("defaults remote dir to /app", async () => {
    writeFileSync(join(tempDir, "App.tsx"), "content");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(tempDir, undefined, { session: "abc123", render: true });

    expect(logs.some((l) => l.includes("/app"))).toBe(true);
  });

  test("skips render with --no-render", async () => {
    writeFileSync(join(tempDir, "App.tsx"), "content");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(tempDir, "/app", { session: "abc123", render: false });

    expect(logs.some((l) => l.includes("Rendered"))).toBe(false);
  });

  test("json mode returns file list and version", async () => {
    writeFileSync(join(tempDir, "App.tsx"), "content");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(tempDir, "/app", { session: "abc123", render: true, json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.files.length).toBe(1);
    expect(parsed.version).toBe(1);
  });

  test("skips dotfiles and node_modules", async () => {
    writeFileSync(join(tempDir, "App.tsx"), "content");
    writeFileSync(join(tempDir, ".hidden"), "secret");
    mkdirSync(join(tempDir, "node_modules"));
    writeFileSync(join(tempDir, "node_modules", "pkg.js"), "module");
    mockConvexCalls();
    const { logs } = captureOutput();

    await push(tempDir, "/app", { session: "abc123", render: true });

    expect(logs.some((l) => l.includes("1 file"))).toBe(true); // Only App.tsx
  });
});
