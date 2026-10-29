/**
 * Tool layer contract. Tools are the ONLY way the agent touches the outside
 * world (OS reminders, calendar, notifications). Every tool:
 *  - runs on-device through sanctioned OS APIs,
 *  - is executed only after validation + (for side effects) user confirmation,
 *  - writes an entry to the privacy audit log.
 */
import type { PrivacyTier } from '../agent/types';

export interface ToolContext {
  tier: PrivacyTier;
  /** Called by the executor after the tool runs. */
  audit: (entry: {
    tool: string;
    summary: string;
    tier: PrivacyTier;
    leftDevice: boolean;
    detail?: string;
  }) => Promise<void>;
}

export interface ToolDefinition {
  name: string;
  /** Plain-language description shown in the confirm dialog. */
  description: string;
  /** True when the tool changes something outside the app. */
  sideEffecting: boolean;
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<{
    ok: boolean;
    summary: string;
    data?: Record<string, unknown>;
    error?: string;
  }>;
}
