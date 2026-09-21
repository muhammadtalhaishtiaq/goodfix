/**
 * Agent core types — the contract every other layer builds against.
 * The orchestrator (deterministic state machine) owns control flow.
 * The model is a slot-filler/router: it returns structured JSON, never
 * acts directly. Validators + user confirmation gate every side effect.
 */

export type ToolName =
  | 'create_reminder'
  | 'create_event'
  | 'save_note'
  | 'recall_memory'
  | 'none';

export interface ToolCall {
  tool: ToolName;
  /** Arguments as parsed from the model's forced-JSON output. */
  args: Record<string, unknown>;
  /** 0..1 self-reported or measured confidence (optional). */
  confidence?: number;
}

export interface ToolResult {
  ok: boolean;
  tool: ToolName;
  /** Human-readable summary shown to the user. */
  summary: string;
  /** Machine payload (ids, timestamps...). */
  data?: Record<string, unknown>;
  error?: string;
}

/** Where the data for this turn is allowed to go. */
export type PrivacyTier = 'local' | 'byok' | 'boost';

export interface AgentTurn {
  id: string;
  input: string;
  tier: PrivacyTier;
  toolCall: ToolCall | null;
  /** Did we ask the user to confirm before acting? */
  confirmRequired: boolean;
  confirmed?: boolean;
  result: ToolResult | null;
  /** Reply text shown in chat. */
  reply: string;
  startedAt: number;
  finishedAt: number;
}

export interface RouterDecision {
  call: ToolCall;
  /** 'model' | 'deterministic-fallback' — recorded for diagnostics. */
  source: 'model' | 'deterministic-fallback';
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** Sanitized args (unknown fields stripped, types coerced where safe). */
  args?: Record<string, unknown>;
}
