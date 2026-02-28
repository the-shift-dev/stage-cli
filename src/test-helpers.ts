import { mock, spyOn } from "bun:test";

/**
 * Mock fetch to return a Convex-style response.
 */
export function mockFetch(value: any = {}) {
  const fetchMock = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: "success", value }),
      text: () => Promise.resolve(JSON.stringify({ status: "success", value })),
    }),
  );
  globalThis.fetch = fetchMock as any;
  return fetchMock;
}

/**
 * Mock fetch to return a Convex-style error response.
 */
export function mockFetchError(status: number, errorMessage: string) {
  const fetchMock = mock(() =>
    Promise.resolve({
      ok: true, // Convex returns 200 with error in body
      json: () => Promise.resolve({ status: "error", errorMessage }),
      text: () => Promise.resolve(JSON.stringify({ status: "error", errorMessage })),
    }),
  );
  globalThis.fetch = fetchMock as any;
  return fetchMock;
}

/**
 * Mock fetch to return HTTP error (not Convex error).
 */
export function mockHttpError(status: number, body: string) {
  const fetchMock = mock(() =>
    Promise.resolve({
      ok: false,
      status,
      text: () => Promise.resolve(body),
    }),
  );
  globalThis.fetch = fetchMock as any;
  return fetchMock;
}

/**
 * Capture console.log and console.error output.
 */
export function captureOutput() {
  const logs: string[] = [];
  const errors: string[] = [];

  const logSpy = spyOn(console, "log").mockImplementation((...args: any[]) => {
    logs.push(args.join(" "));
  });
  const errorSpy = spyOn(console, "error").mockImplementation((...args: any[]) => {
    errors.push(args.join(" "));
  });

  return { logs, errors, logSpy, errorSpy };
}

/**
 * Capture stdout.write output.
 */
export function captureStdout() {
  const chunks: string[] = [];
  const writeSpy = spyOn(process.stdout, "write").mockImplementation((chunk: any) => {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  });
  return { chunks, writeSpy };
}
