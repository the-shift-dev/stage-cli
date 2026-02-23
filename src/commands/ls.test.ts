import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { ls } from "./ls";
import { setBaseUrl } from "../client";

describe("ls", () => {
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

  test("defaults to /app", async () => {
    const fetchMock = mockFetch({ stdout: "/app/App.tsx\n/app/utils.ts\n", stderr: "", exitCode: 0 });
    captureOutput();

    await ls(undefined, { session: "s1" });

    const [, opts] = fetchMock.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.command).toContain("/app");
  });

  test("lists files in custom path", async () => {
    const fetchMock = mockFetch({ stdout: "/src/index.ts\n", stderr: "", exitCode: 0 });
    captureOutput();

    await ls("/src", { session: "s1" });

    const [, opts] = fetchMock.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.command).toContain("/src");
  });

  test("json mode returns file list", async () => {
    mockFetch({ stdout: "/app/A.tsx\n/app/B.tsx\n", stderr: "", exitCode: 0 });
    const { logs } = captureOutput();

    await ls(undefined, { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.files).toEqual(["/app/A.tsx", "/app/B.tsx"]);
    expect(parsed.count).toBe(2);
    expect(parsed.session).toBe("s1");
  });

  test("handles empty directory", async () => {
    mockFetch({ stdout: "", stderr: "", exitCode: 0 });
    const { logs } = captureOutput();

    await ls(undefined, { session: "s1" });

    expect(logs.some((l) => l.includes("empty"))).toBe(true);
  });

  test("json mode returns empty array for empty dir", async () => {
    mockFetch({ stdout: "", stderr: "", exitCode: 0 });
    const { logs } = captureOutput();

    await ls(undefined, { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.files).toEqual([]);
    expect(parsed.count).toBe(0);
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(ls(undefined, { session: "s1" })).rejects.toThrow("EXIT");
  });
});
