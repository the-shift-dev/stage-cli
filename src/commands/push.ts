import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, posix } from "node:path";
import { stagePost } from "../client.js";
import type { OutputOptions } from "../utils/output.js";
import { error, output, success, dim, bullet } from "../utils/output.js";
import { EXIT_ERROR, EXIT_USER_ERROR } from "../utils/exit-codes.js";

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

export async function push(
  localDir: string,
  remoteDir: string | undefined,
  options: OutputOptions & { session?: string; entry?: string; render?: boolean },
): Promise<void> {
  const sessionId = options.session!;
  const targetDir = remoteDir || "/app";

  let stat;
  try {
    stat = statSync(localDir);
  } catch {
    error(`Cannot read ${localDir}`);
    process.exit(EXIT_USER_ERROR);
  }

  const files: Record<string, string> = {};

  if (stat.isFile()) {
    const name = localDir.split("/").pop()!;
    const remotePath = posix.join(targetDir, name);
    files[remotePath] = readFileSync(localDir, "utf-8");
  } else if (stat.isDirectory()) {
    for (const localPath of walkDir(localDir)) {
      const rel = relative(localDir, localPath);
      const remotePath = posix.join(targetDir, ...rel.split("/"));
      files[remotePath] = readFileSync(localPath, "utf-8");
    }
  }

  if (!Object.keys(files).length) {
    error("No files found");
    process.exit(EXIT_USER_ERROR);
  }

  try {
    await stagePost("/api/stage/files", { files }, sessionId);

    let version: number | undefined;
    if (options.render !== false) {
      const entry = options.entry || `${targetDir}/App.tsx`;
      const renderResult = await stagePost("/api/stage/render", { entry }, sessionId);
      version = renderResult.version;
    }

    const paths = Object.keys(files);

    output(options, {
      json: () => ({
        success: true,
        files: paths,
        count: paths.length,
        version,
        session: sessionId,
      }),
      quiet: () => {},
      human: () => {
        success(
          `Pushed ${paths.length} file${paths.length === 1 ? "" : "s"} to ${targetDir}`,
        );
        for (const p of paths) {
          bullet(dim(p));
        }
        if (version !== undefined) {
          success(`Rendered ${dim(`(v${version})`)}`);
        }
      },
    });
  } catch (e: any) {
    error(e.message);
    process.exit(EXIT_ERROR);
  }
}
