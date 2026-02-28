---
name: stage
description: Render React components in a sandboxed browser runtime. Use when you need to create, preview, or iterate on React UIs that the user can see in their browser. Stage handles the rendering — you just write the component code. Works with shadcn/ui, recharts, lucide icons, and Tailwind. Supports multi-file apps with imports between files.
---

# stage

Stage is a sandboxed React runtime for AI agents. Write React components, push them to Stage, and they render live in the browser with real-time updates.

## Installation

```bash
npm install -g stage-ai
```

## Quick Start

```bash
# Create a new session
stage new
# → Session created: abc123
# → URL: https://stage.example.com/s/abc123

# Write a component
stage write /app/App.tsx ./my-component.tsx -s abc123

# Render it
stage render -s abc123

# Open the URL in browser — component is live
```

## Commands

### `stage new`
Create a new session. Returns session ID and URL.

```bash
stage new
stage new --json  # Returns { id, url, convexUrl, mode }
```

### `stage write <remote-path> [local-file] -s <session>`
Write a file to the session. Reads from local file or stdin.

```bash
# From file
stage write /app/App.tsx ./App.tsx -s abc123

# From stdin
echo 'export default () => <h1>Hello</h1>' | stage write /app/App.tsx - -s abc123

# Returns version number
stage write /app/App.tsx ./App.tsx -s abc123 --json
# → { path, version, size }
```

### `stage render [entry] -s <session>`
Trigger rendering. Default entry point is `/app/App.tsx`.

```bash
stage render -s abc123
stage render /app/Main.tsx -s abc123  # Custom entry point
```

### `stage push <local-dir> [remote-dir] -s <session>`
Push entire directory and render. Best for multi-file apps.

```bash
stage push ./my-app /app -s abc123
stage push ./my-app /app -s abc123 --no-render  # Push without rendering
stage push ./my-app /app -s abc123 -e /app/Main.tsx  # Custom entry
```

### `stage ls [path] -s <session>`
List files in session.

```bash
stage ls -s abc123
stage ls /app -s abc123
```

### `stage read <path> -s <session>`
Read file contents.

```bash
stage read /app/App.tsx -s abc123
```

### `stage config`
Show current Convex configuration.

```bash
stage config
# → Mode: cloud
# → URL: https://xxx.convex.cloud
```

## Environment Variables

```bash
# Convex Cloud (recommended)
export CONVEX_URL=https://your-deployment.convex.cloud

# Self-hosted Convex
export CONVEX_SELF_HOSTED_URL=http://localhost:3210
export CONVEX_SELF_HOSTED_ADMIN_KEY=your-key

# Stage frontend URL (for session links)
export STAGE_URL=https://your-stage.vercel.app
```

## Available Libraries

Components have access to:
- **React** — `import { useState, useEffect } from 'react'`
- **shadcn/ui** — `import { Button, Card, ... } from '@/components/ui/button'`
- **lucide-react** — `import { Icon } from 'lucide-react'`
- **recharts** — `import { LineChart, BarChart, ... } from 'recharts'`
- **lodash** — `import _ from 'lodash'`
- **papaparse** — `import Papa from 'papaparse'`
- **Tailwind CSS** — All utility classes available

### shadcn/ui Components

All components available: Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip.

## Multi-File Apps

Stage supports importing between session files:

```tsx
// /app/Button.tsx
import { Button } from '@/components/ui/button';
export function MyButton({ label }) {
  return <Button>{label}</Button>;
}

// /app/App.tsx
import { MyButton } from './Button';
export default function App() {
  return <MyButton label="Click me" />;
}
```

Push both files:
```bash
stage write /app/Button.tsx ./Button.tsx -s abc123
stage write /app/App.tsx ./App.tsx -s abc123
stage render -s abc123
```

Or push directory:
```bash
stage push ./my-app /app -s abc123
```

## Live Data (Convex)

Components can access real-time data:

```tsx
import { liveData, messages, sendMessage, setLiveData } from '@stage/convex';

export default function App() {
  return (
    <div>
      <p>Count: {liveData?.count || 0}</p>
      <button onClick={() => setLiveData({ count: (liveData?.count || 0) + 1 })}>
        Increment
      </button>
      <ul>
        {messages?.map((m, i) => <li key={i}>{m.text}</li>)}
      </ul>
    </div>
  );
}
```

Update data from CLI:
```bash
# Set live data
curl -X POST "$CONVEX_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{"path":"stage:setLiveData","args":{"sessionId":"abc123","data":{"count":42}}}'

# Send message
curl -X POST "$CONVEX_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{"path":"stage:sendMessage","args":{"sessionId":"abc123","text":"Hello!","sender":"Bot"}}'
```

## Workflow for Agents

1. **Create session once** at the start of a task
2. **Write files** as you develop
3. **Render** to see changes
4. **Iterate** — changes are instant via WebSocket

```bash
# Session persists — reuse it
SESSION=$(stage new --quiet)
echo "Working in session: $SESSION"

# Develop iteratively
stage write /app/App.tsx ./v1.tsx -s $SESSION
stage render -s $SESSION
# User reviews...

stage write /app/App.tsx ./v2.tsx -s $SESSION
stage render -s $SESSION
# Instant update in browser
```

## Rules for Agents

1. **Always use `--json`** when parsing output programmatically
2. **Always pass `-s <session>`** on every command
3. **Entry point must default-export a React component**
4. **Use relative imports** (`./Button`) for multi-file apps
5. **Session URLs are shareable** — user can open them anytime
6. **Data persists** — sessions survive restarts (stored in Convex)

## Example: Dashboard

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const data = [
  { month: 'Jan', value: 400 },
  { month: 'Feb', value: 300 },
  { month: 'Mar', value: 600 },
  { month: 'Apr', value: 800 },
  { month: 'May', value: 500 },
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
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-400">Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2,350</div>
            <Badge className="bg-blue-500/20 text-blue-400">+180</Badge>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-slate-400">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+12.5%</div>
            <Badge className="bg-purple-500/20 text-purple-400">On track</Badge>
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
stage write /app/App.tsx ./dashboard.tsx -s abc123
stage render -s abc123
```
