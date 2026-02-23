import { describe, test, expect, beforeEach, spyOn, mock } from "bun:test";
import { output, jsonOutput } from "./output";

describe("output", () => {
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  test("json mode calls json handler and prints JSON", () => {
    const humanFn = mock();

    output({ json: true }, {
      json: () => ({ id: "abc", status: "ok" }),
      human: humanFn,
    });

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({ id: "abc", status: "ok" }, null, 2),
    );
    expect(humanFn).not.toHaveBeenCalled();
  });

  test("quiet mode calls quiet handler", () => {
    const quietFn = mock();
    const humanFn = mock();

    output({ quiet: true }, {
      quiet: quietFn,
      human: humanFn,
    });

    expect(quietFn).toHaveBeenCalled();
    expect(humanFn).not.toHaveBeenCalled();
  });

  test("default calls human handler", () => {
    const humanFn = mock();

    output({}, {
      json: () => ({}),
      human: humanFn,
    });

    expect(humanFn).toHaveBeenCalled();
  });

  test("json mode falls through to human when no json handler", () => {
    const humanFn = mock();

    output({ json: true }, {
      human: humanFn,
    });

    expect(humanFn).toHaveBeenCalled();
  });

  test("quiet mode falls through to human when no quiet handler", () => {
    const humanFn = mock();

    output({ quiet: true }, {
      human: humanFn,
    });

    expect(humanFn).toHaveBeenCalled();
  });
});

describe("jsonOutput", () => {
  test("prints pretty JSON", () => {
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    jsonOutput({ a: 1, b: [2, 3] });
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1, b: [2, 3] }, null, 2));
  });
});
