/**
 * Tool registry — the single place all four v0.1 tools are wired together.
 * The orchestrator looks tools up here by name; the executor runs them.
 */
import type { MemoryStore, RecallHit } from '../memory/types';
import { createEventTool } from './calendar';
import { makeNotesTool } from './notes';
import { makeRecallTool } from './recallTool';
import { createReminderTool } from './reminder';
import type { ToolDefinition } from './types';

/** Tool names that change something outside the app → need user confirmation. */
export const SIDE_EFFECTING = new Set(['create_reminder', 'create_event']);

export interface ToolRegistryDeps {
  memory: MemoryStore;
  recall: (query: string) => Promise<RecallHit[]>;
}

export function buildToolRegistry(deps: ToolRegistryDeps): Map<string, ToolDefinition> {
  const registry = new Map<string, ToolDefinition>();
  const tools: ToolDefinition[] = [
    createReminderTool,
    createEventTool,
    makeNotesTool(deps.memory),
    makeRecallTool(deps.recall),
  ];
  for (const tool of tools) {
    registry.set(tool.name, tool);
  }
  return registry;
}
