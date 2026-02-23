import { stageGet } from "../client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output } from "../utils/output.js";
import { EXIT_ERROR, EXIT_NOT_FOUND } from "../utils/exit-codes.js";

export async function read(
  remotePath: string,
  options: OutputOptions & { session?: string },
): Promise<void> {
  const sessionId = options.session!;

  try {
    const result = await stageGet(
      `/api/stage/files?path=${encodeURIComponent(remotePath)}`,
      sessionId,
    );

    if (result.error) {
      error(result.error);
      process.exit(EXIT_NOT_FOUND);
    }

    output(options, {
      json: () => ({ path: remotePath, content: result.content, session: sessionId }),
      quiet: () => process.stdout.write(result.content),
      human: () => process.stdout.write(result.content),
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
