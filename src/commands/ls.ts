import { stagePost } from "../client.js";
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
    const result = await stagePost(
      "/api/stage/exec",
      { command: `find ${dir} -type f 2>/dev/null | sort` },
      sessionId,
    );

    const files = (result.stdout || "").trim();
    const list = files ? files.split("\n") : [];

    output(options, {
      json: () => ({ path: dir, files: list, count: list.length, session: sessionId }),
      quiet: () => {
        if (files) process.stdout.write(files + "\n");
      },
      human: () => {
        if (!list.length) {
          console.log("(empty)");
          return;
        }
        for (const f of list) {
          console.log(f);
        }
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
