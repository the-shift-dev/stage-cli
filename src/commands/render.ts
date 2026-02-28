import { triggerRender } from "../convex-client.js";
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
    const result = await triggerRender(sessionId, entryPoint);

    output(options, {
      json: () => ({
        success: true,
        entry: result.entry,
        version: result.version,
        session: sessionId,
      }),
      quiet: () => {},
      human: () =>
        success(`Rendered ${result.entry} ${dim(`(v${result.version})`)}`),
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
