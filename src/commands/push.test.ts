import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput } from "../test-helpers";
import { push } from "./push";
import { setBaseUrl } from "../client";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("push", () => {
  const originalFetch = globalThis.fetch;
  const originalExit = process.exit;
  const tmpDir = join(tmpdir(), "stage-cli-test-push");

  beforeEach(() => {
    setBaseUrl("http://localhost:3000");
    process.exit = (() => { throw new Error("EXIT"); }) as any;
    rmSync(tmpDir, { recursive: true, force: true });
    mkdirSync(join(tmpDir, "components"), { recursive: true });
    writeFileSync(join(tmpDir, "App.tsx"), "export default () => <div/>");
    writeFileSync(join(tmpDir, "components", "Button.tsx"), "export const Button = () => <button/>");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.exit = originalExit;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("pushes directory and renders", async () => {
    const fetchMock = mockFetch({ version: 1 });
    captureOutput();

    await push(tmpDir, "/app", { session: "s1" });

    // First call = write files, second = render
    expect(fetchMock.mock.calls.length).toBe(2);
    const writeBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(writeBody.files["/app/App.tsx"]).toBe("export default () => <div/>");
    expect(writeBody.files["/app/components/Button.tsx"]).toBe("export const Button = () => <button/>");
  });

  test("pushes single file", async () => {
    const fetchMock = mockFetch({ version: 1 });
    captureOutput();

    await push(join(tmpDir, "App.tsx"), "/app", { session: "s1" });

    const writeBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(writeBody.files["/app/App.tsx"]).toBe("export default () => <div/>");
    expect(Object.keys(writeBody.files)).toHaveLength(1);
  });

  test("defaults remote dir to /app", async () => {
    const fetchMock = mockFetch({ version: 1 });
    captureOutput();

    await push(tmpDir, undefined, { session: "s1" });

    const writeBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(writeBody.files).every((k) => k.startsWith("/app/"))).toBe(true);
  });

  test("skips render with --no-render", async () => {
    const fetchMock = mockFetch({});
    captureOutput();

    await push(tmpDir, "/app", { session: "s1", render: false });

    // Only one call (write), no render
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  test("json mode returns file list and version", async () => {
    mockFetch({ version: 3 });
    const { logs } = captureOutput();

    await push(tmpDir, "/app", { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(2);
    expect(parsed.files).toContain("/app/App.tsx");
    expect(parsed.files).toContain("/app/components/Button.tsx");
    expect(parsed.version).toBe(3);
    expect(parsed.session).toBe("s1");
  });

  test("skips dotfiles and node_modules", async () => {
    mkdirSync(join(tmpDir, "node_modules"), { recursive: true });
    mkdirSync(join(tmpDir, ".hidden"), { recursive: true });
    writeFileSync(join(tmpDir, "node_modules", "dep.js"), "nope");
    writeFileSync(join(tmpDir, ".hidden", "secret.ts"), "nope");

    const fetchMock = mockFetch({ version: 1 });
    captureOutput();

    await push(tmpDir, "/app", { session: "s1" });

    const writeBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const paths = Object.keys(writeBody.files);
    expect(paths.every((p) => !p.includes("node_modules") && !p.includes(".hidden"))).toBe(true);
  });

  test("exits when path not found", async () => {
    captureOutput();

    expect(push("/nonexistent", "/app", { session: "s1" })).rejects.toThrow("EXIT");
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(push(tmpDir, "/app", { session: "s1" })).rejects.toThrow("EXIT");
  });
});
