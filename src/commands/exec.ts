import { stagePost } from "../client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

export async function exec(
  command: string,
  options: OutputOptions & { session?: string },
): Promise<void> {
  const sessionId = options.session!;

  try {
    const result = await stagePost("/api/stage/exec", { command }, sessionId);

    output(options, {
      json: () => ({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        session: sessionId,
      }),
      quiet: () => {
        if (result.stdout) process.stdout.write(result.stdout);
        process.exit(result.exitCode);
      },
      human: () => {
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        if (result.exitCode !== 0) process.exit(result.exitCode);
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
