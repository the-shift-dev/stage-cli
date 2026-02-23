import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { OutputOptions } from "../utils/output.js";
import { output, success } from "../utils/output.js";

const INSTRUCTIONS = `
<stage>
Use \`stage\` to write, read, and render files in Stage — a sandboxed React runtime.
Stage renders React components live in the browser. No build step, no deploy.

<commands>
- \`stage new\` — create a new session, returns session ID
- \`stage write <remote-path> <local-file> --session <id>\` — write a local file to Stage's virtual FS
- \`stage read <remote-path> --session <id>\` — read a file from Stage
- \`stage exec "<command>" --session <id>\` — run a bash command in Stage's virtual FS
- \`stage render [entry] --session <id>\` — trigger Stage to render (default: /app/App.tsx)
- \`stage ls [path] --session <id>\` — list files in Stage's virtual FS
- \`stage push <local-dir> [remote-dir] --session <id>\` — push a directory to Stage and render
</commands>

<rules>
- ALWAYS pass \`--session <id>\` on every command (create one with \`stage new\`)
- Use \`--json\` for structured output
- Remote paths are absolute (e.g. /app/App.tsx)
- Entry point must default-export a React component
- Available libraries: React, shadcn/ui, recharts, lodash, papaparse
- STAGE_URL env var controls which server to use (default: http://localhost:3000)
</rules>
</stage>
`.trim();

const MARKER = "<stage>";

export async function onboard(
  _args: string[],
  options: OutputOptions,
): Promise<void> {
  const cwd = process.cwd();
  const claudeMd = join(cwd, "CLAUDE.md");
  const agentsMd = join(cwd, "AGENTS.md");

  let targetFile: string;
  if (existsSync(claudeMd)) {
    targetFile = claudeMd;
  } else if (existsSync(agentsMd)) {
    targetFile = agentsMd;
  } else {
    targetFile = claudeMd;
  }

  let existingContent = "";
  if (existsSync(targetFile)) {
    existingContent = readFileSync(targetFile, "utf-8");
  }

  if (existingContent.includes(MARKER)) {
    output(options, {
      json: () => ({
        success: true,
        file: targetFile,
        message: "already_onboarded",
      }),
      human: () => success(`Already onboarded (${targetFile})`),
    });
    return;
  }

  if (existingContent) {
    writeFileSync(
      targetFile,
      `${existingContent.trimEnd()}\n\n${INSTRUCTIONS}\n`,
    );
  } else {
    writeFileSync(targetFile, `${INSTRUCTIONS}\n`);
  }

  output(options, {
    json: () => ({ success: true, file: targetFile }),
    human: () => success(`Added stage instructions to ${targetFile}`),
  });
}
