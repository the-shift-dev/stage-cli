import { createSession, getConvexUrl } from "../convex-client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success, hint } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function newSession(
  options: OutputOptions,
): Promise<void> {
  try {
    const sessionId = await createSession();
    // Derive Stage UI URL from Convex URL (default localhost:3000)
    const stageUrl = process.env.STAGE_URL || "http://localhost:3000";
    const url = `${stageUrl}/s/${sessionId}`;

    output(options, {
      json: () => ({ id: sessionId, url }),
      quiet: () => process.stdout.write(sessionId),
      human: () => {
        success(`Session created: ${sessionId}`);
        hint(`URL: ${url}`);
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
