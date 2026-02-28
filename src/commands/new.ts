import { createSession, getConvexConfig } from "../convex-client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success, hint } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function newSession(
  options: OutputOptions,
): Promise<void> {
  try {
    const sessionId = await createSession();
    const config = getConvexConfig();
    
    // Determine Stage UI URL
    // For cloud: derive from Convex URL or use STAGE_URL
    // For self-hosted: use STAGE_URL or default localhost
    let stageUrl = process.env.STAGE_URL;
    if (!stageUrl) {
      if (config.isSelfHosted) {
        stageUrl = "http://localhost:3000";
      } else {
        // For cloud, try to derive from Convex URL or use a default
        stageUrl = process.env.NEXT_PUBLIC_STAGE_URL || "http://localhost:3000";
      }
    }
    
    const url = `${stageUrl}/s/${sessionId}`;

    output(options, {
      json: () => ({ 
        id: sessionId, 
        url,
        convexUrl: config.url,
        mode: config.isSelfHosted ? "self-hosted" : "cloud",
      }),
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
