import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { read } from "./read";
import { setConvexConfig } from "../convex-client";

describe("read", () => {
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

  test("reads file and writes content to stdout", async () => {
    mockFetch({ path: "/app/App.tsx", content: "export default () => <div/>" });
    const { chunks } = captureStdout();

    await read("/app/App.tsx", { session: "abc123" });

    expect(chunks.join("")).toContain("export default");
  });

  test("json mode returns path and content", async () => {
    mockFetch({ path: "/app/App.tsx", content: "content", version: 2 });
    const { logs } = captureOutput();

    await read("/app/App.tsx", { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.path).toBe("/app/App.tsx");
    expect(parsed.content).toBe("content");
  });

  test("quiet mode writes content to stdout", async () => {
    mockFetch({ path: "/app/App.tsx", content: "hello" });
    const { chunks } = captureStdout();

    await read("/app/App.tsx", { session: "abc123", quiet: true });

    expect(chunks.join("")).toBe("hello");
  });

  test("exits with error when file not found", async () => {
    mockFetch(null); // No file found
    captureOutput();

    expect(read("/app/Missing.tsx", { session: "abc123" })).rejects.toThrow("EXIT");
  });
});
