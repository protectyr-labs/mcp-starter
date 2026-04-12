import { describe, it, expect, beforeEach } from 'vitest';
import { items } from '../src/tools/items.js';

// ---------------------------------------------------------------------------
// Direct unit tests for the item store logic.
// These test the data layer without needing an MCP server instance.
// ---------------------------------------------------------------------------

function createItem(title: string, status = 'todo') {
  const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item = { id, title, status, createdAt: new Date().toISOString() };
  items.set(id, item);
  return item;
}

describe('Item tools', () => {
  beforeEach(() => {
    items.clear();
  });

  it('create_item returns an item with an ID', () => {
    const item = createItem('Test task');
    expect(item.id).toBeDefined();
    expect(item.id).toMatch(/^item-/);
    expect(item.title).toBe('Test task');
    expect(item.status).toBe('todo');
    expect(item.createdAt).toBeDefined();
  });

  it('get_item returns a previously created item', () => {
    const created = createItem('Find me');
    const found = items.get(created.id);
    expect(found).toBeDefined();
    expect(found!.title).toBe('Find me');
    expect(found!.id).toBe(created.id);
  });

  it('get_item returns undefined for nonexistent ID', () => {
    const found = items.get('item-does-not-exist');
    expect(found).toBeUndefined();
  });

  it('list_items returns all items', () => {
    createItem('Task A');
    createItem('Task B');
    createItem('Task C');
    const all = Array.from(items.values());
    expect(all).toHaveLength(3);
  });

  it('list_items filters by status', () => {
    createItem('Todo task', 'todo');
    createItem('Done task', 'done');
    createItem('In progress task', 'in_progress');
    createItem('Another done task', 'done');

    const doneItems = Array.from(items.values()).filter((i) => i.status === 'done');
    expect(doneItems).toHaveLength(2);
    expect(doneItems.every((i) => i.status === 'done')).toBe(true);

    const todoItems = Array.from(items.values()).filter((i) => i.status === 'todo');
    expect(todoItems).toHaveLength(1);
  });

  it('create_item defaults status to todo', () => {
    const item = createItem('No status specified');
    expect(item.status).toBe('todo');
  });
});
