#!/usr/bin/env node

import { createRequire } from "node:module";
import { Command } from "commander";
import { setConvexConfig, getConvexConfig, printConfig } from "./convex-client.js";
import { newSession } from "./commands/new.js";
import { write } from "./commands/write.js";
import { read } from "./commands/read.js";
import { exec } from "./commands/exec.js";
import { render } from "./commands/render.js";
import { ls } from "./commands/ls.js";
import { push } from "./commands/push.js";
import { onboard } from "./commands/onboard.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("stage")
  .description(`CLI client for Stage — a sandboxed React runtime for AI agents

Environment variables:
  CONVEX_URL                    Convex Cloud deployment URL
  CONVEX_SELF_HOSTED_URL        Self-hosted Convex URL
  CONVEX_SELF_HOSTED_ADMIN_KEY  Self-hosted admin key
  STAGE_URL                     Stage frontend URL (for session links)`)
  .version(`stage ${version}`, "-v, --version")
  .option("--json", "Output as JSON")
  .option("-q, --quiet", "Suppress output")
  .option("-u, --url <url>", "Convex URL (overrides env vars)")
  .option("--self-hosted", "Force self-hosted mode")
  .option("--cloud", "Force cloud mode");

program
  .command("config")
  .description("Show current Convex configuration")
  .action(() => {
    printConfig();
  });

program
  .command("new")
  .description("Create a new session")
  .action(async (_opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await newSession({ json: root.json, quiet: root.quiet });
  });

program
  .command("write <remote-path> [local-file]")
  .description("Write a file to Stage (from local file or stdin)")
  .requiredOption("-s, --session <id>", "Session ID")
  .action(async (remotePath, localFile, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await write(remotePath, localFile, { json: root.json, quiet: root.quiet, session: opts.session });
  });

program
  .command("read <remote-path>")
  .description("Read a file from Stage")
  .requiredOption("-s, --session <id>", "Session ID")
  .action(async (remotePath, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await read(remotePath, { json: root.json, quiet: root.quiet, session: opts.session });
  });

program
  .command("exec <command>")
  .description("[DEPRECATED] Not supported with Convex backend")
  .requiredOption("-s, --session <id>", "Session ID")
  .action(async (command, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await exec(command, { json: root.json, quiet: root.quiet, session: opts.session });
  });

program
  .command("render [entry]")
  .description("Trigger Stage to render a component (default: /app/App.tsx)")
  .requiredOption("-s, --session <id>", "Session ID")
  .action(async (entry, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await render(entry, { json: root.json, quiet: root.quiet, session: opts.session });
  });

program
  .command("ls [path]")
  .description("List files in session")
  .requiredOption("-s, --session <id>", "Session ID")
  .action(async (path, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await ls(path, { json: root.json, quiet: root.quiet, session: opts.session });
  });

program
  .command("push <local-dir> [remote-dir]")
  .description("Push a local directory to Stage and render")
  .requiredOption("-s, --session <id>", "Session ID")
  .option("-e, --entry <path>", "Entry point to render")
  .option("--no-render", "Skip auto-render after push")
  .action(async (localDir, remoteDir, opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await push(localDir, remoteDir, {
      json: root.json,
      quiet: root.quiet,
      session: opts.session,
      entry: opts.entry,
      render: opts.render,
    });
  });

program
  .command("onboard")
  .description("Add stage instructions to CLAUDE.md or AGENTS.md")
  .action(async (_opts, cmd) => {
    const root = cmd.optsWithGlobals();
    await onboard([], { json: root.json, quiet: root.quiet });
  });

program.hook("preAction", (_thisCommand, actionCommand) => {
  const root = actionCommand.optsWithGlobals();
  
  // Configure Convex client based on flags
  if (root.url) {
    const isSelfHosted = root.selfHosted || (!root.cloud && !root.url.includes("convex.cloud"));
    setConvexConfig({ 
      url: root.url, 
      isSelfHosted,
      adminKey: process.env.CONVEX_SELF_HOSTED_ADMIN_KEY,
    });
  } else if (root.cloud) {
    setConvexConfig({ isSelfHosted: false });
  } else if (root.selfHosted) {
    setConvexConfig({ isSelfHosted: true });
  }
});

program.parseAsync(process.argv).catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
