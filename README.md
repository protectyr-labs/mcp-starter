# @protectyr-labs/mcp-starter

Production-grade MCP (Model Context Protocol) server starter template. Clone it, swap the example tools for your domain, and ship.

[![CI](https://github.com/protectyr-labs/mcp-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/mcp-starter/actions/workflows/ci.yml)

## Why This Exists

Building an MCP server from scratch means solving the same problems every time: stdio transport wiring, tool registration boilerplate, graceful shutdown, and the console.log footgun that corrupts the protocol. This template gives you all the production patterns so you can focus on your tools.

## What You Get

- **Stdio transport** with proper lifecycle management (connect, shutdown, error handling)
- **Modular tool registration** -- one file per domain, easy to add or remove
- **Graceful shutdown** -- SIGINT, SIGTERM, and uncaughtException handlers
- **Audit logging pattern** -- all logs go to stderr via `console.error()`, never stdout
- **3 example tools** (create_item, get_item, list_items) showing the full pattern
- **TypeScript** with strict mode, ESM modules, and declaration files
- **CI pipeline** testing Node 18, 20, and 22

## Quick Start

```bash
# Clone the template
gh repo clone protectyr-labs/mcp-starter my-mcp-server
cd my-mcp-server

# Install and build
npm install
npm run build

# Run tests
npm test
```

## MCP Server Setup

Add to your `claude_desktop_config.json`:

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

Or if you publish to npm:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@your-org/my-mcp-server"]
    }
  }
}
```

## Adding Your Own Tools

1. Create a new file in `src/tools/` (e.g., `src/tools/users.ts`):

```typescript
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function registerUserTools(server: Server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_user',
        description: 'Look up a user by email',
        inputSchema: {
          type: 'object' as const,
          properties: {
            email: { type: 'string', description: 'User email address' },
          },
          required: ['email'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case 'get_user': {
        // Your logic here
        return { content: [{ type: 'text', text: 'User data...' }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  });
}
```

2. Register it in `src/tools/index.ts`:

```typescript
import { registerUserTools } from './users.js';

export function registerTools(server: Server) {
  registerItemTools(server);
  registerUserTools(server);  // Add this line
}
```

3. Build and test:

```bash
npm run build
npm test
```

**Important:** When you have multiple tool groups, the MCP SDK merges all `ListToolsRequestSchema` handlers. Each tool group file should list only its own tools. The `CallToolRequestSchema` handler's default case catches unknown tools, so each group only needs to handle its own tool names.

## Production Checklist

Before deploying your MCP server, verify these common gotchas:

| Check | Why |
|-------|-----|
| No `console.log()` anywhere | Corrupts the stdio protocol. Use `console.error()` for all logging. |
| SIGTERM handler present | Container orchestrators (Docker, K8s) send SIGTERM before killing. Clean up resources. |
| Input validation on all tools | MCP clients can send anything. Validate before processing. |
| Error responses use `isError: true` | Tells the client the call failed so it can retry or report. |
| Tool descriptions are specific | Vague descriptions = wrong tool selection by the LLM. Be precise. |
| `inputSchema.required` is set | Without it, LLMs may omit critical fields. |

## Project Structure

```
src/
  index.ts           # Entry point: server creation, transport, lifecycle
  tools/
    index.ts         # Tool registration hub
    items.ts         # Example tool group (create, get, list)
tests/
  starter.test.ts    # Unit tests for tool logic
```

## Related

- [@protectyr-labs/mcp-exec-team](https://github.com/protectyr-labs/mcp-exec-team) -- Multi-persona debate engine (advanced MCP server example)
- [@protectyr-labs/mcp-audit-wrapper](https://github.com/protectyr-labs/mcp-audit-wrapper) -- Audit logging wrapper for MCP tool calls
- [MCP Protocol Specification](https://modelcontextprotocol.io/) -- Official spec

## License

MIT
