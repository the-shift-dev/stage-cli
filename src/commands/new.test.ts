import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { newSession } from "./new";
import { setBaseUrl } from "../client";

describe("new", () => {
  const originalFetch = globalThis.fetch;
  const originalExit = process.exit;

  beforeEach(() => {
    setBaseUrl("http://localhost:3000");
    process.exit = (() => { throw new Error("EXIT"); }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.exit = originalExit;
  });

  test("creates session and shows human output", async () => {
    mockFetch({ id: "abc123" });
    const { logs } = captureOutput();

    await newSession({});

    expect(logs.some((l) => l.includes("abc123"))).toBe(true);
  });

  test("json mode returns session id and url", async () => {
    mockFetch({ id: "abc123" });
    const { logs } = captureOutput();

    await newSession({ json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.id).toBe("abc123");
    expect(parsed.url).toBe("http://localhost:3000/s/abc123");
  });

  test("quiet mode writes only session id to stdout", async () => {
    mockFetch({ id: "abc123" });
    const { chunks } = captureStdout();

    await newSession({ quiet: true });

    expect(chunks.join("")).toBe("abc123");
  });

  test("exits on error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(newSession({})).rejects.toThrow("EXIT");
  });
});
