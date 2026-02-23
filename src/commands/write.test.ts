import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput, captureStdout } from "../test-helpers";
import { write } from "./write";
import { setBaseUrl } from "../client";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("write", () => {
  const originalFetch = globalThis.fetch;
  const originalExit = process.exit;
  const tmpDir = join(tmpdir(), "stage-cli-test-write");
  const tmpFile = join(tmpDir, "test.tsx");

  beforeEach(() => {
    setBaseUrl("http://localhost:3000");
    process.exit = (() => { throw new Error("EXIT"); }) as any;
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(tmpFile, "export default () => <div>hi</div>");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.exit = originalExit;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("writes local file to remote path", async () => {
    const fetchMock = mockFetch({});
    captureOutput();

    await write("/app/App.tsx", tmpFile, { session: "s1" });

    const [, opts] = fetchMock.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.files["/app/App.tsx"]).toBe("export default () => <div>hi</div>");
  });

  test("json mode returns path and bytes", async () => {
    mockFetch({});
    const { logs } = captureOutput();

    await write("/app/App.tsx", tmpFile, { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.success).toBe(true);
    expect(parsed.path).toBe("/app/App.tsx");
    expect(parsed.bytes).toBeGreaterThan(0);
    expect(parsed.session).toBe("s1");
  });

  test("human mode shows success with bytes", async () => {
    mockFetch({});
    const { logs } = captureOutput();

    await write("/app/App.tsx", tmpFile, { session: "s1" });

    expect(logs.some((l) => l.includes("/app/App.tsx"))).toBe(true);
    expect(logs.some((l) => l.includes("bytes"))).toBe(true);
  });

  test("exits when local file not found", async () => {
    captureOutput();

    expect(
      write("/app/App.tsx", "/nonexistent/file.tsx", { session: "s1" }),
    ).rejects.toThrow("EXIT");
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(write("/app/App.tsx", tmpFile, { session: "s1" })).rejects.toThrow("EXIT");
  });
});
