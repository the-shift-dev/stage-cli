import { getAllFiles } from "../convex-client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function ls(
  remotePath: string | undefined,
  options: OutputOptions & { session?: string },
): Promise<void> {
  const sessionId = options.session!;
  const dir = remotePath || "/app";

  try {
    const files = await getAllFiles(sessionId);
    
    // Filter by directory if specified
    const filtered = files
      .filter(f => f.path.startsWith(dir))
      .map(f => f.path)
      .sort();

    output(options, {
      json: () => ({ path: dir, files: filtered, count: filtered.length, session: sessionId }),
      quiet: () => {
        if (filtered.length) process.stdout.write(filtered.join("\n") + "\n");
      },
      human: () => {
        if (!filtered.length) {
          console.log("(empty)");
          return;
        }
        for (const f of filtered) {
          console.log(f);
        }
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
