import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ---------------------------------------------------------------------------
// In-memory store (replace with your database in production)
// ---------------------------------------------------------------------------

interface Item {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

const items = new Map<string, Item>();

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerItemTools(server: Server) {
  // -- List available tools --------------------------------------------------
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'create_item',
        description: 'Create a new item with a title and optional status.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string', description: 'Item title' },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              default: 'todo',
              description: 'Item status (defaults to "todo")',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'get_item',
        description: 'Get a single item by its ID.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            id: { type: 'string', description: 'Item ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_items',
        description: 'List all items, optionally filtered by status.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done'],
              description: 'Filter by status',
            },
          },
        },
      },
    ],
  }));

  // -- Handle tool calls -----------------------------------------------------
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'create_item': {
        const id = `item-${Date.now()}`;
        const item: Item = {
          id,
          title: (args as Record<string, unknown>).title as string,
          status: ((args as Record<string, unknown>).status as string) || 'todo',
          createdAt: new Date().toISOString(),
        };
        items.set(id, item);
        console.error(`[mcp-starter] Created item ${id}`);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }

      case 'get_item': {
        const item = items.get((args as Record<string, unknown>).id as string);
        if (!item) {
          return { content: [{ type: 'text', text: 'Item not found' }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }

      case 'list_items': {
        let results = Array.from(items.values());
        const statusFilter = (args as Record<string, unknown>).status as string | undefined;
        if (statusFilter) {
          results = results.filter((i) => i.status === statusFilter);
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });
}

// ---------------------------------------------------------------------------
// Export for testing
// ---------------------------------------------------------------------------

export { items };
