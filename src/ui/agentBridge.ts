/**
 * Lazy bridge to the agent module (src/state/agent.ts), which is built by
 * another agent in parallel. We never import it statically — that would break
 * typechecking while its file doesn't exist yet. Instead we load it lazily at
 * call time via require() in a try/catch and fall back gracefully.
 *
 * Contract we code against:
 *   getAgent(): Promise<{ turn(input: string): Promise<AgentTurn> }>
 */
export interface AgentTurn {
  reply: string;
  confirmRequired: boolean;
  confirmPrompt?: string;
  /** Kind of the pending action (tool name) — drives "always allow". */
  actionKind?: string;
  approve?: () => Promise<AgentTurn>;
  reject?: () => void;
}

export interface Agent {
  turn(input: string): Promise<AgentTurn>;
}

interface AgentModule {
  getAgent: () => Promise<Agent>;
}

/**
 * Returns the agent module, or null when it isn't ready yet.
 * Safe to call any time; never throws.
 */
export function loadAgent(): AgentModule | null {
  try {
    const m = require('../state/agent');
    if (m && typeof m.getAgent === 'function') {
      return m as AgentModule;
    }
    return null;
  } catch {
    return null;
  }
}
