# stage-cli

> CLI client for [Stage](https://github.com/the-shift-dev/stage) — a sandboxed React runtime for AI agents.

Write files, run commands, and render React components in Stage's virtual filesystem. From the terminal. From any agent.

## Install

```bash
npm install -g stage-cli
```

## Quick Start

```bash
# Create a session
stage new
# ✓ Session created: abc123
#   URL: http://localhost:3000/s/abc123

# Write a component
stage write /app/App.tsx ./App.tsx --session abc123

# Render it
stage render --session abc123

# Push a whole project
stage push ./my-app /app --session abc123
```

Every command requires `--session <id>`. Create one with `stage new`.

## Commands

### `stage new`

Create a new session. Each session gets its own isolated virtual filesystem.

```bash
stage new
stage new --json    # { "id": "abc123", "url": "http://localhost:3000/s/abc123" }
stage new -q        # prints just the ID
```

### `stage write <remote-path> [local-file] --session <id>`

Write a file to Stage's virtual FS. Reads from a local file or stdin (`-`).

```bash
stage write /app/App.tsx ./App.tsx --session abc123
echo '<h1>Hi</h1>' | stage write /app/App.tsx - --session abc123
```

### `stage read <remote-path> --session <id>`

Read a file from Stage.

```bash
stage read /app/App.tsx --session abc123
```

### `stage exec <command> --session <id>`

Run a bash command in Stage's virtual filesystem.

```bash
stage exec "ls /app" --session abc123
stage exec "cat /app/App.tsx | grep import" --session abc123
```

### `stage render [entry] --session <id>`

Trigger Stage to render a component. Defaults to `/app/App.tsx`.

```bash
stage render --session abc123                     # renders /app/App.tsx
stage render /app/Dashboard.tsx --session abc123   # renders specific entry
```

### `stage ls [path] --session <id>`

List files in Stage's virtual FS.

```bash
stage ls --session abc123            # list /app
stage ls /app/src --session abc123   # list subdirectory
```

### `stage push <local-dir> [remote-dir] --session <id>`

Push a local directory to Stage and auto-render.

```bash
stage push ./my-app --session abc123                    # push to /app
stage push ./src /app/src --session abc123              # push to specific dir
stage push ./my-app -e /app/Main.tsx --session abc123   # custom entry point
stage push ./my-app --no-render --session abc123        # skip auto-render
```

### `stage onboard`

Add Stage instructions to `CLAUDE.md` or `AGENTS.md` so agents know how to use it.

```bash
stage onboard
```

## For Agents

Every command supports `--json` for structured output:

```bash
stage ls --json --session abc123
# { "path": "/app", "files": ["/app/App.tsx"], "count": 1, "session": "abc123" }

stage exec "ls /app" --json --session abc123
# { "stdout": "App.tsx\n", "stderr": "", "exitCode": 0, "session": "abc123" }
```

Run `stage onboard` in your project to teach agents the commands.

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `STAGE_URL` | `http://localhost:3000` | Stage server URL |

## Available Libraries in Stage

Components rendered in Stage have access to:

- React (hooks, JSX)
- [shadcn/ui](https://ui.shadcn.com/) (Card, Button, Badge, Tabs, etc.)
- [Recharts](https://recharts.org/) (BarChart, LineChart, PieChart, etc.)
- [Lodash](https://lodash.com/)
- [PapaParse](https://www.papaparse.com/) (CSV parsing)

## License

MIT
