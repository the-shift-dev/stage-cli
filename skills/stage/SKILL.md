---
name: stage
description: Build and deploy React applications to a sandboxed browser runtime. Use when the user wants to build an application — dashboards, forms, visualizations, prototypes, or any interactive UI. Stage handles rendering; you write the components. Supports shadcn/ui, recharts, lucide icons, Tailwind, and multi-file apps with real-time data via Convex.
---

# stage

Stage is a sandboxed React runtime for AI agents. Write React components, push them to Stage, and they render live in the browser. Changes sync instantly via WebSocket.

## When to Use

Use Stage when the user wants to **build an application**:
- Dashboards and data visualizations
- Forms and interactive UIs
- Prototypes and demos
- Any React-based application

## Quick Start

```bash
# 1. Create a session (this IS the app — save this ID)
SESSION=$(stage new --quiet)

# 2. Write your component
stage write /app/App.tsx ./App.tsx -s $SESSION

# 3. Render it
stage render -s $SESSION

# 4. Share the URL with the user
echo "View your app: $(stage new --json | jq -r .url)"
```

## Session = App

**One session per application.** The session ID is the app's identity.

- Create session once at the start
- Reuse the same session ID for all commands
- Session persists across conversation turns
- Share the session URL with the user — it's their app

```bash
# Save session at start
SESSION=$(stage new --quiet)

# Use it for everything
stage write /app/App.tsx ./code.tsx -s $SESSION
stage status -s $SESSION
stage push ./app -s $SESSION
```

## Commands

| Command | Description |
|---------|-------------|
| `stage new` | Create new session, returns ID and URL |
| `stage write <path> <file> -s ID` | Write a file to session |
| `stage push <dir> -s ID` | Push directory and render |
| `stage render -s ID` | Trigger render |
| `stage status -s ID` | Check status and errors |
| `stage ls -s ID` | List files |
| `stage read <path> -s ID` | Read file contents |

### Output Modes

All commands support:
- `--json` — Structured JSON output for parsing
- `--quiet` — Minimal output (just IDs/values)
- Default — Human-readable with colors

## Component Requirements

### Entry Point

The entry point (default `/app/App.tsx`) must **default-export a React component**:

```tsx
// ✅ Correct
export default function App() {
  return <div>Hello</div>;
}

// ✅ Also correct
const App = () => <div>Hello</div>;
export default App;

// ❌ Wrong — no default export
export function App() { ... }

// ❌ Wrong — not a component
export default "hello";
```

### TypeScript/JSX

Full TypeScript and JSX support. No build step needed — Stage compiles on the fly.

## Available Libraries

### React
```tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
```

### shadcn/ui (All Components)
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// ... all shadcn/ui components available
```

**Available:** Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip.

### Recharts
```tsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
```

### Lucide Icons
```tsx
import { Home, Settings, User, ChevronRight, Loader2 } from 'lucide-react';
```

### Utilities
```tsx
import _ from 'lodash';
import Papa from 'papaparse';
```

### Tailwind CSS
All Tailwind utility classes available. Dark mode supported.

## What's NOT Available

- ❌ `fetch()` to external APIs
- ❌ Node.js APIs (fs, path, etc.)
- ❌ npm packages beyond the allowlist
- ❌ External script loading

## Multi-File Apps

Stage supports importing between session files:

```
/app/
  App.tsx        # Entry point
  Button.tsx     # import { MyButton } from './Button'
  utils.ts       # import { formatDate } from './utils'
  types.ts       # import type { User } from './types'
```

### Import Syntax

```tsx
// Relative imports (recommended)
import { MyButton } from './Button';
import { formatDate } from './utils';

// Absolute paths also work
import { MyButton } from '/app/Button';
```

### Push Directory

```bash
# Push entire directory at once
stage push ./my-app /app -s $SESSION

# Custom entry point
stage push ./my-app /app -s $SESSION -e /app/Main.tsx
```

## Live Data (@stage/convex)

Components can access real-time persistent data via Convex:

```tsx
import { liveData, setLiveData, messages, sendMessage } from '@stage/convex';

export default function App() {
  return (
    <div className="p-8">
      {/* liveData is reactive — updates in real-time */}
      <p>Count: {liveData?.count || 0}</p>
      
      <button onClick={() => setLiveData({ count: (liveData?.count || 0) + 1 })}>
        Increment
      </button>

      {/* Messages list */}
      <div className="mt-4">
        {messages?.map((msg, i) => (
          <div key={i}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <button onClick={() => sendMessage('Hello!', 'User')}>
        Send Message
      </button>
    </div>
  );
}
```

### Live Data API

| Export | Type | Description |
|--------|------|-------------|
| `liveData` | `any` | Current live data (reactive) |
| `setLiveData(data)` | `(data: any) => Promise` | Replace live data |
| `messages` | `Message[]` | All messages (reactive) |
| `sendMessage(text, sender)` | `(text: string, sender: string) => Promise` | Add message |

### Use Cases

- Real-time counters and state
- Chat/messaging interfaces
- Collaborative features
- Agent-to-app communication

## Error Handling

### Check Status

```bash
stage status -s $SESSION
```

Output shows:
- Current render state (OK or Error)
- Entry point and version
- Error message if any
- File list

### Error Workflow

1. Push code
2. If user reports error OR check `stage status`
3. Read the error message
4. Fix the code
5. Push again

```bash
# Check for errors
stage status -s $SESSION --json | jq -r '.render.error // "ok"'

# If error, read the code
stage read /app/App.tsx -s $SESSION

# Fix and re-push
stage write /app/App.tsx ./fixed.tsx -s $SESSION
stage render -s $SESSION
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ReferenceError: X is not defined` | Using undefined variable | Define or import it |
| `Security violations` | Using disallowed import | Use allowed imports only |
| `X is not a function` | Wrong export or import | Check export/import syntax |
| `Cannot read property of undefined` | Accessing missing data | Add null checks |

## Complete Example

### Dashboard App

```tsx
// /app/App.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const data = [
  { month: 'Jan', value: 400 },
  { month: 'Feb', value: 300 },
  { month: 'Mar', value: 600 },
  { month: 'Apr', value: 800 },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-400">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$45,231</div>
            <Badge className="bg-green-500/20 text-green-400">+20.1%</Badge>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

```bash
stage write /app/App.tsx ./dashboard.tsx -s $SESSION
stage render -s $SESSION
```

## Rules for Agents

1. **Create session once** — save the ID, reuse it
2. **Session = App** — one session per application
3. **Always use `-s <session>`** on every command
4. **Use `--json`** when parsing output
5. **Check `stage status`** if something seems wrong
6. **Entry must default-export** a React component
7. **Use relative imports** (`./Button`) for multi-file
8. **Fix errors by reading, fixing, pushing** — iterate fast

## Environment Setup

```bash
# Convex Cloud (production)
export CONVEX_URL=https://your-deployment.convex.cloud
export STAGE_URL=https://your-stage.vercel.app

# Self-hosted
export CONVEX_SELF_HOSTED_URL=http://localhost:3210
export STAGE_URL=http://localhost:3000
```
