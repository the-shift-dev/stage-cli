import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { exec } from "./exec";
import { setBaseUrl } from "../client";

describe("exec", () => {
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

  test("sends command and shows stdout", async () => {
    mockFetch({ stdout: "file1\nfile2\n", stderr: "", exitCode: 0 });
    const { chunks } = captureStdout();

    await exec("ls", { session: "s1" });

    expect(chunks.join("")).toBe("file1\nfile2\n");
  });

  test("json mode returns structured output", async () => {
    mockFetch({ stdout: "hello", stderr: "warn", exitCode: 0 });
    const { logs } = captureOutput();

    await exec("echo hello", { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.stdout).toBe("hello");
    expect(parsed.stderr).toBe("warn");
    expect(parsed.exitCode).toBe(0);
    expect(parsed.session).toBe("s1");
  });

  test("quiet mode writes stdout and exits with code", async () => {
    mockFetch({ stdout: "out", stderr: "", exitCode: 0 });
    const { chunks } = captureStdout();

    // exitCode 0 still calls process.exit(0) in quiet mode
    try {
      await exec("cmd", { quiet: true, session: "s1" });
    } catch {}

    expect(chunks.join("")).toBe("out");
  });

  test("human mode exits with non-zero exit code", async () => {
    mockFetch({ stdout: "", stderr: "error", exitCode: 1 });
    captureOutput();

    expect(exec("bad", { session: "s1" })).rejects.toThrow("EXIT");
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(exec("cmd", { session: "s1" })).rejects.toThrow("EXIT");
  });
});
