# Architecture Decisions

This document explains the key design choices in this MCP server template and why they matter.

## Why Stdio Over HTTP

The MCP protocol specification defines stdio as the transport for local servers. When Claude Desktop (or any MCP client) launches your server, it communicates over stdin/stdout using JSON-RPC. This is simpler and more secure than HTTP for local tool servers:

- No port conflicts or firewall issues
- No authentication layer needed
- Process lifecycle is managed by the client
- Automatic cleanup when the client disconnects

HTTP transport exists in the MCP spec for remote servers, but most MCP servers are local tools. Start with stdio.

## Why Modular Tool Registration

Each tool group lives in its own file under `src/tools/`. This pattern scales:

- **Add a tool group:** Create a new file, export a register function, add one line to `src/tools/index.ts`.
- **Remove a tool group:** Delete the file and remove the import.
- **Test a tool group:** Import its logic directly without starting the server.

The alternative (all tools in one giant file) becomes unmanageable past 5-6 tools. Production servers commonly have 10-20 tools across multiple domains.

## Why Graceful Shutdown Matters

MCP servers often hold resources: database connections, file handles, background pollers. Without graceful shutdown:

- Database transactions may be left in an inconsistent state
- Temporary files may not be cleaned up
- Background processes may become orphaned
- Clients may not receive final responses

The template handles SIGINT (Ctrl+C), SIGTERM (container stop), and uncaughtException (unexpected errors). Add your cleanup logic inside the `shutdown()` function.

## Why No console.log()

This is the number one mistake new MCP server builders make. The stdio transport uses stdout for JSON-RPC messages between client and server. A single `console.log("debugging...")` injects invalid data into the protocol stream, causing:

- Parse errors on the client side
- Dropped tool responses
- Silent failures that are extremely hard to debug

All logging MUST use `console.error()`, which writes to stderr. The MCP client ignores stderr, so it is safe for diagnostics. This rule applies to every dependency you import -- if a library uses `console.log`, you need to suppress or redirect it.

## Why In-Memory Store for the Demo

The example tools use a `Map<string, Item>` as their data store. This is intentional:

- Zero dependencies -- no database driver to install or configure
- Instant startup -- no connection pool to warm up
- Focus on the pattern -- the MCP wiring is the lesson, not the data layer

In production, replace the Map with your database client (Postgres, SQLite, Redis, etc.). The tool handler pattern stays the same -- only the data access calls change.

## Why TypeScript with Strict Mode

TypeScript with `strict: true` catches entire categories of bugs at compile time:

- Null/undefined access on tool arguments
- Missing handler cases in switch statements
- Type mismatches between tool schemas and handler code

The MCP SDK has full TypeScript support, so you get autocomplete and type checking on all protocol types.
