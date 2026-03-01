import { getStatus as getSessionStatus, SessionStatus } from "../convex-client.js";
import { error, output, dim, bold } from "../utils/output.js";
import { EXIT_ERROR } from "../utils/exit-codes.js";

interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
  session: string;
}

export async function status(_args: string[], options: OutputOptions): Promise<void> {
  const { session } = options;

  try {
    const result: SessionStatus = await getSessionStatus(session);

    if (!result || !result.session) {
      error(`Session not found: ${session}`);
      process.exit(EXIT_ERROR);
    }

    output(options, {
      json: () => ({
        sessionId: session,
        ...result,
      }),
      quiet: () => {
        // Just output error if any, or "ok"
        if (result.render?.error) {
          process.stdout.write(result.render.error);
        } else {
          process.stdout.write("ok");
        }
      },
      human: () => {
        console.log();
        console.log(bold("Session"), dim(session));
        console.log();

        if (result.render) {
          const status = result.render.error ? "❌ Error" : "✓ OK";
          console.log(bold("Status"), status);
          console.log(bold("Entry"), result.render.entry);
          console.log(bold("Version"), `v${result.render.version}`);
          
          if (result.render.renderedAt) {
            const ago = formatTimeAgo(result.render.renderedAt);
            console.log(bold("Rendered"), ago);
          }

          if (result.render.error) {
            console.log();
            console.log(bold("Error:"));
            console.log(dim("─".repeat(50)));
            console.log(result.render.error);
            console.log(dim("─".repeat(50)));
          }
        } else {
          console.log(bold("Status"), dim("Not rendered yet"));
        }

        console.log();
        console.log(bold("Files"), `(${result.files.length})`);
        for (const file of result.files) {
          console.log(`  ${file.path} ${dim(`v${file.version} ${file.size}b`)}`);
        }
        console.log();
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
