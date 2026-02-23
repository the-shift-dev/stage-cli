import { stagePost } from "../client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success, dim } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function render(
  entry: string | undefined,
  options: OutputOptions & { session?: string },
): Promise<void> {
  const sessionId = options.session!;
  const entryPoint = entry || "/app/App.tsx";

  try {
    const result = await stagePost("/api/stage/render", { entry: entryPoint }, sessionId);

    output(options, {
      json: () => ({
        success: true,
        entry: entryPoint,
        version: result.version,
        session: sessionId,
      }),
      quiet: () => {},
      human: () =>
        success(`Rendered ${entryPoint} ${dim(`(v${result.version})`)}`),
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
