import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { read } from "./read";
import { setBaseUrl } from "../client";

describe("read", () => {
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

  test("reads file and writes content to stdout", async () => {
    mockFetch({ content: "export default () => <div/>" });
    const { chunks } = captureStdout();

    await read("/app/App.tsx", { session: "s1" });

    expect(chunks.join("")).toBe("export default () => <div/>");
  });

  test("json mode returns path and content", async () => {
    mockFetch({ content: "hello" });
    const { logs } = captureOutput();

    await read("/app/App.tsx", { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.path).toBe("/app/App.tsx");
    expect(parsed.content).toBe("hello");
    expect(parsed.session).toBe("s1");
  });

  test("quiet mode writes content to stdout", async () => {
    mockFetch({ content: "code" });
    const { chunks } = captureStdout();

    await read("/app/App.tsx", { quiet: true, session: "s1" });

    expect(chunks.join("")).toBe("code");
  });

  test("exits when file has error", async () => {
    mockFetch({ error: "File not found" });
    captureOutput();

    expect(read("/app/nope.tsx", { session: "s1" })).rejects.toThrow("EXIT");
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(read("/app/App.tsx", { session: "s1" })).rejects.toThrow("EXIT");
  });
});
