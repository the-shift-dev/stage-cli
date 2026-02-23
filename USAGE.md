# Stage CLI — Usage Guide

Stage lets any AI coding agent ship a live React app in three commands. No build step, no deploy, no config.

## Setup

```bash
# Clone and install
git clone git@github.com:the-shift-dev/stage-cli.git
cd stage-cli
bun install

# Set the production server
export STAGE_URL=https://stage-oqj40elap-livsmichael-gmailcoms-projects.vercel.app
```

Add the export to your shell profile (`~/.zshrc` / `~/.bashrc`) so it persists.

## Usage

### 1. Create a session

```bash
stage new
```

Every session gets its own isolated Linux VM. The session ID is your handle for everything.

### 2. Write code

```bash
# From a file
stage write /app/App.tsx ./MyComponent.tsx --session <id>

# From stdin
echo 'export default () => <h1>Hello</h1>' | stage write /app/App.tsx - --session <id>

# Push a whole directory
stage push ./my-app --session <id>
```

### 3. Render

```bash
stage render --session <id>
```

Open the URL printed by `stage new` in your browser. That's it.

## All Commands

| Command | What it does |
|---------|-------------|
| `stage new` | Create a session. Returns ID + URL. |
| `stage write <path> <file> -s <id>` | Write a file to the session's filesystem. |
| `stage read <path> -s <id>` | Read a file back. |
| `stage exec "<cmd>" -s <id>` | Run a bash command in the session. |
| `stage render [entry] -s <id>` | Render a component (default: `/app/App.tsx`). |
| `stage ls [path] -s <id>` | List files. |
| `stage push <dir> [remote] -s <id>` | Push a local directory and auto-render. |
| `stage onboard` | Add Stage instructions to your CLAUDE.md / AGENTS.md. |

`--session` / `-s` is required on every command except `new` and `onboard`.

## For AI Agents

Run `stage onboard` in any project. It appends Stage instructions to `CLAUDE.md` so agents know the commands.

Every command supports `--json` for structured output and `--quiet` / `-q` for scripts:

```bash
# Get just the session ID
SESSION=$(stage new -q)

# Structured output for agents
stage ls --json -s $SESSION
```

## What's Available in Stage

Your component must `export default` a React component. These libraries are pre-loaded:

- **React** — hooks, JSX, the usual
- **shadcn/ui** — Card, Button, Badge, Tabs, Input, etc. (`import { Card } from "@/components/ui/card"`)
- **Recharts** — BarChart, LineChart, PieChart, AreaChart, etc.
- **Lodash** — `import _ from "lodash"`
- **PapaParse** — CSV parsing

No `npm install` needed. Just import and use.

## Example: Agent Workflow

```bash
# Agent creates a session
SESSION=$(stage new -q)

# Agent writes a dashboard
cat <<'TSX' | stage write /app/App.tsx - -s $SESSION
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 600 },
  { name: "Thu", value: 800 },
  { name: "Fri", value: 500 },
];

export default function App() {
  return (
    <div style={{ padding: 40, background: "#0a0a0f", minHeight: "100vh" }}>
      <h1 style={{ color: "#fff", fontFamily: "system-ui" }}>Weekly Report</h1>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
TSX

# Agent renders it
stage render -s $SESSION

# Live at $STAGE_URL/s/$SESSION
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STAGE_URL` | `http://localhost:3000` | Stage server URL |

## Running Locally

If you want to run your own Stage server:

```bash
git clone git@github.com:the-shift-dev/stage.git
cd stage
npm install
npm run dev
# Server at http://localhost:3000

# In another terminal, no STAGE_URL needed (defaults to localhost)
stage new
```
