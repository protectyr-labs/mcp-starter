import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerItemTools } from './items.js';

/**
 * Register all tool groups with the MCP server.
 *
 * Pattern: one file per domain, each exporting a registerXxxTools() function.
 * This keeps the codebase modular -- add or remove tool groups by editing
 * this single file.
 */
export function registerTools(server: Server) {
  registerItemTools(server);
  // Add more tool groups here:
  // registerUserTools(server);
  // registerReportTools(server);
  console.error('[mcp-starter] Tools registered');
}
