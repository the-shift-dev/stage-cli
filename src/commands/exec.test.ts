import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { captureOutput } from "../test-helpers";
import { exec } from "./exec";

describe("exec", () => {
  const originalExit = process.exit;

  beforeEach(() => {
    process.exit = (() => { throw new Error("EXIT"); }) as any;
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  test("shows deprecation error", async () => {
    const { errors } = captureOutput();

    expect(exec("ls -la", { session: "abc123" })).rejects.toThrow("EXIT");
    expect(errors.some((e) => e.includes("not supported"))).toBe(true);
  });
});
