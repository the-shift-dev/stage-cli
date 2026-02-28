import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput } from "../test-helpers";
import { render } from "./render";
import { setConvexConfig } from "../convex-client";

describe("render", () => {
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

  test("renders default entry point", async () => {
    mockFetch({ entry: "/app/App.tsx", version: 1 });
    const { logs } = captureOutput();

    await render(undefined, { session: "abc123" });

    expect(logs.some((l) => l.includes("/app/App.tsx"))).toBe(true);
  });

  test("renders custom entry point", async () => {
    mockFetch({ entry: "/app/Main.tsx", version: 1 });
    const { logs } = captureOutput();

    await render("/app/Main.tsx", { session: "abc123" });

    expect(logs.some((l) => l.includes("/app/Main.tsx"))).toBe(true);
  });

  test("json mode returns version and entry", async () => {
    mockFetch({ entry: "/app/App.tsx", version: 5 });
    const { logs } = captureOutput();

    await render(undefined, { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.entry).toBe("/app/App.tsx");
    expect(parsed.version).toBe(5);
  });

  test("human mode shows success with version", async () => {
    mockFetch({ entry: "/app/App.tsx", version: 3 });
    const { logs } = captureOutput();

    await render(undefined, { session: "abc123" });

    expect(logs.some((l) => l.includes("v3"))).toBe(true);
  });
});
