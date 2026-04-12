#!/usr/bin/env node
/**
 * MCP Server Starter -- production-grade template.
 *
 * CRITICAL: Never use console.log() -- it corrupts the stdio protocol.
 * All logging must use console.error() (writes to stderr).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

const SERVER_NAME = 'mcp-starter';
const SERVER_VERSION = '0.1.0';

async function main() {
  console.error(`[${SERVER_NAME}] Starting v${SERVER_VERSION}...`);

  // Create MCP server
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  // Register all tools
  registerTools(server);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] Connected via stdio transport`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`[${SERVER_NAME}] Received ${signal}, shutting down...`);
    // Add cleanup logic here (close DB connections, flush buffers, etc.)
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error(`[${SERVER_NAME}] Uncaught exception:`, err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(`[${SERVER_NAME}] Fatal:`, err);
  process.exit(1);
});
