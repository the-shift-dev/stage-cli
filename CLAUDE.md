# stage-cli

CLI client for Stage — a sandboxed React runtime for AI agents.

## Commands

```bash
bun run dev -- <command>     # Dev
bun test                     # Tests
bun run check                # Biome lint + format
```

## Architecture

- `src/main.ts` — Commander entry point, global --json/--quiet flags
- `src/client.ts` — HTTP client for Stage server API
- `src/commands/` — One file per command (write, read, exec, render, ls, push, onboard)
- `src/utils/output.ts` — Chalk output helpers, triple output (json/quiet/human)
- `src/utils/exit-codes.ts` — Standardized exit codes

## Key Patterns

- **Output triple**: Every command supports `--json`, `--quiet`, and human-readable output
- **No local state**: Pure API client — all state lives in Stage's virtual FS
- **stdin support**: `stage write /path -` reads from stdin
- **STAGE_URL env var**: Defaults to `http://localhost:3000`

## Adding a New Command

1. Create `src/commands/<name>.ts`
2. Export an async function with `(args, options: OutputOptions)` signature
3. Import and register in `src/main.ts` as a Commander subcommand
4. Use the `output()` helper for triple output
