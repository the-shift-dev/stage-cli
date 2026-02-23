import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, mockFetchError, captureOutput } from "../test-helpers";
import { render } from "./render";
import { setBaseUrl } from "../client";

describe("render", () => {
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

  test("renders default entry point", async () => {
    const fetchMock = mockFetch({ version: 1 });
    captureOutput();

    await render(undefined, { session: "s1" });

    const [, opts] = fetchMock.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.entry).toBe("/app/App.tsx");
  });

  test("renders custom entry point", async () => {
    const fetchMock = mockFetch({ version: 2 });
    captureOutput();

    await render("/app/Main.tsx", { session: "s1" });

    const [, opts] = fetchMock.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.entry).toBe("/app/Main.tsx");
  });

  test("json mode returns version and entry", async () => {
    mockFetch({ version: 3 });
    const { logs } = captureOutput();

    await render(undefined, { json: true, session: "s1" });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.success).toBe(true);
    expect(parsed.entry).toBe("/app/App.tsx");
    expect(parsed.version).toBe(3);
    expect(parsed.session).toBe("s1");
  });

  test("human mode shows success with version", async () => {
    mockFetch({ version: 5 });
    const { logs } = captureOutput();

    await render(undefined, { session: "s1" });

    expect(logs.some((l) => l.includes("Rendered"))).toBe(true);
    expect(logs.some((l) => l.includes("v5"))).toBe(true);
  });

  test("exits on fetch error", async () => {
    mockFetchError(500, "boom");
    captureOutput();

    expect(render(undefined, { session: "s1" })).rejects.toThrow("EXIT");
  });
});
