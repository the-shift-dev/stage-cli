import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { newSession } from "./new";
import { setConvexConfig } from "../convex-client";

describe("new", () => {
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

  test("creates session and shows human output", async () => {
    mockFetch("session-abc123"); // Convex returns session ID directly
    const { logs } = captureOutput();

    await newSession({});

    expect(logs.some((l) => l.includes("session-abc123"))).toBe(true);
  });

  test("json mode returns session id and url", async () => {
    mockFetch("session-abc123");
    const { logs } = captureOutput();

    await newSession({ json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.id).toBe("session-abc123");
    expect(parsed.url).toContain("/s/session-abc123");
  });

  test("quiet mode writes only session id to stdout", async () => {
    mockFetch("session-abc123");
    const { chunks } = captureStdout();

    await newSession({ quiet: true });

    expect(chunks.join("")).toBe("session-abc123");
  });

  test("exits on error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(newSession({})).rejects.toThrow("EXIT");
  });
});
