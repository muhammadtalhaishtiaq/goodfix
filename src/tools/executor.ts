/**
 * ToolExecutor — runs validated ToolCalls against the registry.
 * Validation happens in the orchestrator; the executor trusts validated
 * calls but still wraps execution in try/catch so a tool can never throw
 * out into the turn loop. Every run is audit-logged via the tool's context.
 */
import type { PrivacyTier, ToolCall, ToolResult } from '../agent/types';
import type { ToolContext, ToolDefinition } from './types';

export class ToolExecutor {
  constructor(
    private readonly registry: Map<string, ToolDefinition>,
    private readonly audit: ToolContext['audit'],
  ) {}

  async run(call: ToolCall, tier: PrivacyTier): Promise<ToolResult> {
    const tool = this.registry.get(call.tool);
    if (!tool) {
      return {
        ok: false,
        tool: call.tool,
        summary: '',
        error: `Unknown tool: "${call.tool}".`,
      };
    }

    const ctx: ToolContext = { tier, audit: this.audit };
    try {
      const res = await tool.execute(call.args ?? {}, ctx);
      return {
        ok: res.ok,
        tool: call.tool,
        summary: res.summary,
        data: res.data,
        error: res.error,
      };
    } catch (e) {
      return {
        ok: false,
        tool: call.tool,
        summary: '',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
