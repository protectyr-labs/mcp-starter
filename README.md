# mcp-starter

> Production-ready MCP server template. Clone and build.

[![CI](https://github.com/protectyr-labs/mcp-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/mcp-starter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

Everything you need to build a production MCP server: stdio transport, modular tool registration, graceful shutdown, and the `console.log` footgun handled for you.

## Quick Start

```bash
gh repo clone protectyr-labs/mcp-starter my-mcp-server
cd my-mcp-server
npm install && npm run build
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/my-mcp-server/dist/index.js"]
    }
  }
}
```

## What You Get

- **Stdio transport** -- correct lifecycle, clean shutdown on SIGINT/SIGTERM
- **No `console.log`** -- the #1 mistake that corrupts MCP's stdio protocol
- **Modular tools** -- one file per tool group, register in `tools/index.ts`
- **3 example tools** -- `create_item`, `get_item`, `list_items` (replace with yours)
- **Graceful shutdown** -- handles SIGINT, SIGTERM, uncaughtException
- **CI pipeline** -- tests on Node 18, 20, and 22

## Adding Your Own Tools

1. Create `src/tools/users.ts`:

```typescript
export function registerUserTools(server: Server) {
  // List your tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: 'get_user',
      description: 'Look up a user by email',
      inputSchema: {
        type: 'object' as const,
        properties: { email: { type: 'string' } },
        required: ['email'],
      },
    }],
  }));

  // Handle calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'get_user') {
      return { content: [{ type: 'text', text: JSON.stringify(user) }] };
    }
    return { content: [{ type: 'text', text: `Unknown tool` }], isError: true };
  });
}
```

2. Register in `src/tools/index.ts`:

```typescript
import { registerUserTools } from './users.js';
registerUserTools(server);
```

3. `npm run build && npm test`

## Production Checklist

| Check | Why |
|-------|-----|
| No `console.log()` anywhere | Corrupts the stdio protocol. Use `console.error()`. |
| SIGTERM handler present | Container orchestrators send SIGTERM before killing. |
| Input validation on all tools | MCP clients can send anything. Validate first. |
| Error responses use `isError: true` | Tells the client the call failed. |
| Tool descriptions are specific | Vague descriptions = wrong tool selection by the LLM. |
| `inputSchema.required` is set | Without it, LLMs may omit critical fields. |

## Built With This

- [mcp-exec-team](https://github.com/protectyr-labs/mcp-exec-team) -- multi-persona debate engine (5 tools)

## Limitations

- Example tools use in-memory store (replace with your database)
- No authentication (add your own middleware)
- Single-process only (no horizontal scaling)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.

## License

MIT
