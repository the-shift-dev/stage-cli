import { getBaseUrl, stagePost } from "../client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success, hint, cmd, dim } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function newSession(
  options: OutputOptions,
): Promise<void> {
  try {
    const result = await stagePost("/api/stage/sessions", {});
    const url = `${getBaseUrl()}/s/${result.id}`;

    output(options, {
      json: () => ({ id: result.id, url }),
      quiet: () => process.stdout.write(result.id),
      human: () => {
        success(`Session created: ${result.id}`);
        hint(`URL: ${url}`);
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
