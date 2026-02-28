import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { write } from "./write";
import { setConvexConfig } from "../convex-client";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("write", () => {
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

  test("writes local file to remote path", async () => {
    const localFile = join(tempDir, "test.tsx");
    writeFileSync(localFile, "export default () => <div>Test</div>");
    
    mockFetch({ path: "/app/App.tsx", version: 1, size: 36 });
    const { logs } = captureOutput();

    await write("/app/App.tsx", localFile, { session: "abc123" });

    expect(logs.some((l) => l.includes("/app/App.tsx"))).toBe(true);
  });

  test("json mode returns path and bytes", async () => {
    const localFile = join(tempDir, "test.tsx");
    writeFileSync(localFile, "content");
    
    mockFetch({ path: "/app/App.tsx", version: 1, size: 7 });
    const { logs } = captureOutput();

    await write("/app/App.tsx", localFile, { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.path).toBe("/app/App.tsx");
    expect(parsed.bytes).toBe(7);
    expect(parsed.version).toBe(1);
  });

  test("human mode shows success with bytes", async () => {
    const localFile = join(tempDir, "test.tsx");
    writeFileSync(localFile, "content");
    
    mockFetch({ path: "/app/App.tsx", version: 2, size: 7 });
    const { logs } = captureOutput();

    await write("/app/App.tsx", localFile, { session: "abc123" });

    expect(logs.some((l) => l.includes("7 bytes") && l.includes("v2"))).toBe(true);
  });
});
