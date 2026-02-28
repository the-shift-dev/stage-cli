import { readFileSync } from "node:fs";
import { writeFile } from "../convex-client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success } from "../utils/output.js";
import { EXIT_ERROR, EXIT_USER_ERROR } from "../utils/exit-codes.js";

export async function write(
  remotePath: string,
  localPath: string | undefined,
  options: OutputOptions & { session?: string },
): Promise<void> {
  const sessionId = options.session!;
  let content: string;

  if (localPath === "-" || (!localPath && !process.stdin.isTTY)) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    content = Buffer.concat(chunks).toString("utf-8");
  } else if (localPath) {
    try {
      content = readFileSync(localPath, "utf-8");
    } catch (e: any) {
      error(`Cannot read ${localPath}: ${e.message}`);
      process.exit(EXIT_USER_ERROR);
    }
  } else {
    error("Provide a local file path or pipe content via stdin");
    process.exit(EXIT_USER_ERROR);
  }

  try {
    const result = await writeFile(sessionId, remotePath, content);

    output(options, {
      json: () => ({ success: true, path: remotePath, bytes: content.length, version: result.version, session: sessionId }),
      quiet: () => {},
      human: () => success(`${remotePath} (${content.length} bytes, v${result.version})`),
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
