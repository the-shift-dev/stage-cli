import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mockFetch, captureOutput } from "../test-helpers";
import { status } from "./status";
import { setConvexConfig } from "../convex-client";

describe("status", () => {
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

  test("shows session status", async () => {
    mockFetch({
      session: { createdAt: Date.now(), lastAccessedAt: Date.now() },
      render: { entry: "/app/App.tsx", version: 1, error: null, renderedAt: Date.now() },
      files: [{ path: "/app/App.tsx", version: 1, size: 100 }]
    });
    const { logs } = captureOutput();

    await status([], { session: "abc123" });

    expect(logs.some((l) => l.includes("OK"))).toBe(true);
    expect(logs.some((l) => l.includes("/app/App.tsx"))).toBe(true);
  });

  test("shows error when render has error", async () => {
    mockFetch({
      session: { createdAt: Date.now(), lastAccessedAt: Date.now() },
      render: { entry: "/app/App.tsx", version: 1, error: "ReferenceError: x is not defined", renderedAt: Date.now() },
      files: [{ path: "/app/App.tsx", version: 1, size: 100 }]
    });
    const { logs } = captureOutput();

    await status([], { session: "abc123" });

    expect(logs.some((l) => l.includes("Error"))).toBe(true);
    expect(logs.some((l) => l.includes("ReferenceError"))).toBe(true);
  });

  test("json mode returns full status", async () => {
    mockFetch({
      session: { createdAt: 1000, lastAccessedAt: 2000 },
      render: { entry: "/app/App.tsx", version: 2, error: null, renderedAt: 3000 },
      files: [{ path: "/app/App.tsx", version: 2, size: 100 }]
    });
    const { logs } = captureOutput();

    await status([], { session: "abc123", json: true });

    const parsed = JSON.parse(logs[0]);
    expect(parsed.sessionId).toBe("abc123");
    expect(parsed.render.version).toBe(2);
    expect(parsed.files.length).toBe(1);
  });
});
