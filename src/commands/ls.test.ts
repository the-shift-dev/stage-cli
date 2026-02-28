import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, captureOutput, captureStdout } from "../test-helpers";
import { ls } from "./ls";
import { setConvexConfig } from "../convex-client";

describe("ls", () => {
  const originalFetch = globalThis.fetch;
  const originalExit = process.exit;

  beforeEach(() => {
    setConvexConfig({ url: "http://localhost:3210", isSelfHosted: true });
    process.exit = (() => { throw new Error("EXIT"); }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.exit = originalExit;
  });

  test("defaults to /app", async () => {
    mockFetch([
      { path: "/app/App.tsx", content: "..." },
      { path: "/app/Button.tsx", content: "..." },
    ]);
    const { logs } = captureOutput();

    await ls(undefined, { session: "abc123" });

    expect(logs.some((l) => l.includes("/app/App.tsx"))).toBe(true);
    expect(logs.some((l) => l.includes("/app/Button.tsx"))).toBe(true);
  });

  test("lists files in custom path", async () => {
    mockFetch([
      { path: "/lib/utils.ts", content: "..." },
    ]);
    const { logs } = captureOutput();

    await ls("/lib", { session: "abc123" });

    expect(logs.some((l) => l.includes("/lib/utils.ts"))).toBe(true);
  });

  test("json mode returns file list", async () => {
    mockFetch([
      { path: "/app/App.tsx", content: "..." },
    ]);
    const { logs } = captureOutput();

    await ls(undefined, { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.files).toContain("/app/App.tsx");
  });

  test("handles empty directory", async () => {
    mockFetch([]);
    const { logs } = captureOutput();

    await ls(undefined, { session: "abc123" });

    expect(logs.some((l) => l.includes("empty"))).toBe(true);
  });

  test("json mode returns empty array for empty dir", async () => {
    mockFetch([]);
    const { logs } = captureOutput();

    await ls(undefined, { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.files).toEqual([]);
    expect(parsed.count).toBe(0);
  });
});
