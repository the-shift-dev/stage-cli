import type { OutputOptions } from "../utils/output.js";
import { error } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function exec(
  _command: string,
  _options: OutputOptions & { session?: string },
): Promise<void> {
  error("exec command is not supported with Convex backend");
  error("Use 'stage ls' to list files, or write/read files directly");
  process.exit(EXIT_ERROR);
}
