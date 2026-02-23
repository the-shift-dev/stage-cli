import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { setBaseUrl, getBaseUrl, stagePost, stageGet, stageDelete } from "./client";

describe("client", () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof mock>;

  beforeEach(() => {
    fetchMock = mock();
    globalThis.fetch = fetchMock as any;
    // Reset URL override
    setBaseUrl(undefined as any);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.STAGE_URL;
  });

  describe("getBaseUrl", () => {
    test("defaults to localhost:3000", () => {
      expect(getBaseUrl()).toBe("http://localhost:3000");
    });

    test("uses STAGE_URL env var", () => {
      process.env.STAGE_URL = "https://example.com";
      expect(getBaseUrl()).toBe("https://example.com");
    });

    test("setBaseUrl overrides env var", () => {
      process.env.STAGE_URL = "https://example.com";
      setBaseUrl("https://override.com");
      expect(getBaseUrl()).toBe("https://override.com");
    });
  });

  describe("stagePost", () => {
    test("posts JSON to correct URL", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "abc" }),
      });

      const result = await stagePost("/api/stage/sessions", { foo: "bar" });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("http://localhost:3000/api/stage/sessions");
      expect(opts.method).toBe("POST");
      expect(opts.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(opts.body)).toEqual({ foo: "bar" });
      expect(result).toEqual({ id: "abc" });
    });

    test("includes session header when provided", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await stagePost("/api/stage/exec", { command: "ls" }, "sess123");

      const [, opts] = fetchMock.mock.calls[0];
      expect(opts.headers["X-Stage-Session"]).toBe("sess123");
    });

    test("throws on non-ok response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      expect(stagePost("/api/stage/sessions", {})).rejects.toThrow(
        "Stage 500: Internal Server Error",
      );
    });
  });

  describe("stageGet", () => {
    test("gets from correct URL", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: "hello" }),
      });

      const result = await stageGet("/api/stage/files?path=/app/App.tsx");

      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("http://localhost:3000/api/stage/files?path=/app/App.tsx");
      expect(opts.method).toBeUndefined();
      expect(result).toEqual({ content: "hello" });
    });

    test("includes session header when provided", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await stageGet("/api/stage/files", "sess456");

      const [, opts] = fetchMock.mock.calls[0];
      expect(opts.headers["X-Stage-Session"]).toBe("sess456");
    });

    test("throws on non-ok response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not Found"),
      });

      expect(stageGet("/api/stage/files")).rejects.toThrow("Stage 404: Not Found");
    });
  });

  describe("stageDelete", () => {
    test("sends DELETE request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const result = await stageDelete("/api/stage/sessions/abc");

      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toBe("http://localhost:3000/api/stage/sessions/abc");
      expect(opts.method).toBe("DELETE");
      expect(result).toEqual({ ok: true });
    });

    test("throws on non-ok response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      });

      expect(stageDelete("/api/stage/sessions/abc")).rejects.toThrow(
        "Stage 403: Forbidden",
      );
    });
  });
});
