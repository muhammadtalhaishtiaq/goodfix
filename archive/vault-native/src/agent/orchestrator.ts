import { Router } from './router';
import { validateToolCall } from './validator';
import { buildChatPrompt } from './prompts';
import type {
  AgentTurn,
  PrivacyTier,
  ToolCall,
  ToolName,
  ToolResult,
} from './types';
import type { InferenceEngine } from '../inference/types';
import type { MemoryStore, RecallHit } from '../memory/types';
import type { ToolDefinition } from '../tools/types';
import { ToolExecutor } from '../tools/executor';

/**
 * Orchestrator — the deterministic state machine that owns control flow.
 * The model only fills slots (router) or drafts conversational text; it never
 * acts directly. Rules enforced here:
 *  - every tool call is validated before anything happens;
 *  - side-effecting tools (create_reminder, create_event) NEVER execute
 *    without an explicit user confirm() — turn() only asks;
 *  - every turn and every audit entry is recorded;
 *  - privacy tier is ALWAYS 'local' in v0.1 (nothing leaves the device).
 */

export interface AuditEntry {
  turnId: string;
  event:
    | 'turn'
    | 'routed'
    | 'validated'
    | 'executed'
    | 'confirm_requested'
    | 'confirmed'
    | 'rejected'
    | 'error';
  tool?: string;
  source?: 'model' | 'deterministic-fallback';
  tier: PrivacyTier;
  leftDevice: boolean;
  detail?: string;
  at: number;
}

export interface OrchestratorDeps {
  engine: InferenceEngine | null;
  memory: MemoryStore;
  tools: Map<string, ToolDefinition>;
  audit: (entry: AuditEntry) => Promise<void>;
}

interface PendingTurn {
  call: ToolCall;
  input: string;
  startedAt: number;
}

const SIDE_EFFECTING: readonly ToolName[] = ['create_reminder', 'create_event'];

let turnCounter = 0;
function newTurnId(): string {
  turnCounter += 1;
  return `turn_${Date.now().toString(36)}_${turnCounter.toString(36)}_${Math.floor(
    Math.random() * 46656,
  ).toString(36)}`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/** Human-readable confirmation prompt for a validated side-effecting call. */
export function buildConfirmPrompt(
  tool: ToolName,
  args: Record<string, unknown>,
): string {
  const title = typeof args.title === 'string' ? args.title : '';
  const when =
    typeof args.datetime_iso === 'string'
      ? formatWhen(args.datetime_iso)
      : '';
  if (tool === 'create_reminder') {
    return `Create reminder "${title}" at ${when}?`;
  }
  if (tool === 'create_event') {
    const dur =
      typeof args.duration_min === 'number' ? ` (${args.duration_min} min)` : '';
    return `Add calendar event "${title}" at ${when}${dur}?`;
  }
  return 'Do this?';
}

export class Orchestrator {
  private readonly engine: InferenceEngine | null;
  private readonly memory: MemoryStore;
  private readonly tools: Map<string, ToolDefinition>;
  private readonly auditFn: (entry: AuditEntry) => Promise<void>;
  private readonly pending = new Map<string, PendingTurn>();

  constructor(deps: OrchestratorDeps) {
    this.engine = deps.engine;
    this.memory = deps.memory;
    this.tools = deps.tools;
    this.auditFn = deps.audit;
  }

  private audit(
    entry: Omit<AuditEntry, 'tier' | 'leftDevice' | 'at'>,
  ): Promise<void> {
    // v0.1: everything is local; nothing ever leaves the device.
    return this.auditFn({
      ...entry,
      tier: 'local',
      leftDevice: false,
      at: Date.now(),
    });
  }

  private finish(base: {
    id: string;
    input: string;
    toolCall: ToolCall | null;
    confirmRequired: boolean;
    actionKind?: string;
    confirmed?: boolean;
    result: ToolResult | null;
    reply: string;
    startedAt: number;
  }): AgentTurn {
    return { ...base, tier: 'local', finishedAt: Date.now() };
  }

  /** One user message in -> one turn out. Never executes side effects. */
  async turn(input: string): Promise<AgentTurn> {
    const startedAt = Date.now();
    const id = newTurnId();
    await this.audit({
      turnId: id,
      event: 'turn',
      detail: input.slice(0, 200),
    });

    try {
      const decision = await new Router(this.engine).route(input);
      const { call } = decision;
      await this.audit({
        turnId: id,
        event: 'routed',
        tool: call.tool,
        source: decision.source,
        detail: JSON.stringify(call.args).slice(0, 300),
      });

      const validation = validateToolCall(call.tool, call.args);
      if (!validation.ok || !validation.args) {
        await this.audit({
          turnId: id,
          event: 'validated',
          tool: call.tool,
          detail: `failed: ${validation.errors.join('; ')}`,
        });
        return this.finish({
          id,
          input,
          toolCall: call,
          confirmRequired: false,
          result: {
            ok: false,
            tool: call.tool,
            summary: 'Validation failed.',
            error: validation.errors.join('; '),
          },
          reply: `I couldn't quite get the details right: ${validation.errors[0] ?? 'invalid input'}. Could you rephrase that?`,
          startedAt,
        });
      }
      await this.audit({ turnId: id, event: 'validated', tool: call.tool, detail: 'ok' });
      const args = validation.args;

      if (call.tool === 'none') {
        const reply = await this.conversationalReply(input);
        return this.finish({
          id,
          input,
          toolCall: { tool: 'none', args },
          confirmRequired: false,
          result: { ok: true, tool: 'none', summary: 'No action needed.' },
          reply,
          startedAt,
        });
      }

      if (call.tool === 'save_note') {
        const body = args.body as string;
        const note = await this.memory.save(body, 'note');
        await this.audit({
          turnId: id,
          event: 'executed',
          tool: 'save_note',
          detail: `note ${note.id}`,
        });
        return this.finish({
          id,
          input,
          toolCall: { tool: 'save_note', args },
          confirmRequired: false,
          confirmed: true,
          result: {
            ok: true,
            tool: 'save_note',
            summary: 'Saved to your private memory.',
            data: { noteId: note.id },
          },
          reply: "Saved. It stays on your phone — nothing was sent anywhere.",
          startedAt,
        });
      }

      if (call.tool === 'recall_memory') {
        const query = args.query as string;
        const hits = await this.memory.recall(query, 5);
        await this.audit({
          turnId: id,
          event: 'executed',
          tool: 'recall_memory',
          detail: `${hits.length} hit(s)`,
        });
        const reply = await this.recallReply(input, hits);
        return this.finish({
          id,
          input,
          toolCall: { tool: 'recall_memory', args },
          confirmRequired: false,
          confirmed: true,
          result: {
            ok: true,
            tool: 'recall_memory',
            summary: `Found ${hits.length} note(s).`,
            data: { count: hits.length },
          },
          reply,
          startedAt,
        });
      }

      if (SIDE_EFFECTING.includes(call.tool)) {
        // Ask, don't act. Execution happens only in confirm().
        const pendingCall: ToolCall = { tool: call.tool, args };
        this.pending.set(id, { call: pendingCall, input, startedAt });
        const confirmPrompt = buildConfirmPrompt(call.tool, args);
        await this.audit({
          turnId: id,
          event: 'confirm_requested',
          tool: call.tool,
          detail: confirmPrompt,
        });
        return this.finish({
          id,
          input,
          toolCall: pendingCall,
          confirmRequired: true,
          // The parked action's kind — the UI's "always allow" gate keys
          // off this; without it the checkbox can never render.
          actionKind: call.tool,
          result: null,
          reply: confirmPrompt,
          startedAt,
        });
      }

      // Unreachable: the validator guarantees a known tool. Stay total anyway.
      return this.finish({
        id,
        input,
        toolCall: call,
        confirmRequired: false,
        result: {
          ok: false,
          tool: call.tool,
          summary: 'Unknown tool.',
          error: `unhandled tool: ${call.tool}`,
        },
        reply: "I don't know how to do that yet.",
        startedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.audit({ turnId: id, event: 'error', detail: message });
      return this.finish({
        id,
        input,
        toolCall: null,
        confirmRequired: false,
        result: {
          ok: false,
          tool: 'none',
          summary: 'Something went wrong.',
          error: message,
        },
        reply:
          'Something went wrong on my end. Your data is safe — nothing was sent anywhere. Try again?',
        startedAt,
      });
    }
  }

  /**
   * Resolve a pending confirm. Executes the tool only when approved.
   * Always audits the outcome.
   */
  async confirm(turnId: string, approved: boolean): Promise<AgentTurn> {
    const startedAt = Date.now();
    const pendingTurn = this.pending.get(turnId);
    if (!pendingTurn) {
      const id = newTurnId();
      await this.audit({
        turnId: id,
        event: 'error',
        detail: `confirm: unknown turn ${turnId}`,
      });
      return this.finish({
        id,
        input: '',
        toolCall: null,
        confirmRequired: false,
        result: {
          ok: false,
          tool: 'none',
          summary: 'Nothing to confirm.',
          error: 'unknown turn id',
        },
        reply: 'There is nothing waiting for confirmation.',
        startedAt,
      });
    }
    this.pending.delete(turnId);
    const { call, input } = pendingTurn;

    if (!approved) {
      await this.audit({ turnId, event: 'rejected', tool: call.tool });
      return this.finish({
        id: turnId,
        input,
        toolCall: call,
        confirmRequired: false,
        confirmed: false,
        result: { ok: false, tool: call.tool, summary: 'Cancelled by user.' },
        reply: "Okay, I won't do that.",
        startedAt: pendingTurn.startedAt,
      });
    }

    if (!this.tools.has(call.tool)) {
      await this.audit({
        turnId,
        event: 'error',
        tool: call.tool,
        detail: 'tool not registered',
      });
      return this.finish({
        id: turnId,
        input,
        toolCall: call,
        confirmRequired: false,
        confirmed: true,
        result: {
          ok: false,
          tool: call.tool,
          summary: 'Tool not available.',
          error: `tool not registered: ${call.tool}`,
        },
        reply: 'That tool is not available right now.',
        startedAt: pendingTurn.startedAt,
      });
    }

    await this.audit({ turnId, event: 'confirmed', tool: call.tool });
    // Execution goes through ToolExecutor (the validated-call runner):
    // it builds the tool context — tools audit their own runs through it,
    // forwarded here as orchestrator 'executed' entries — and never lets
    // a throwing tool escape into the turn loop.
    const executor = new ToolExecutor(this.tools, async (entry) => {
      await this.audit({
        turnId,
        event: 'executed',
        tool: entry.tool,
        detail: entry.summary,
      });
    });
    const result = await executor.run(call, 'local');
    if (!result.ok && result.error) {
      await this.audit({ turnId, event: 'error', tool: call.tool, detail: result.error });
    }
    await this.audit({ turnId, event: 'executed', tool: call.tool, detail: result.summary });
    return this.finish({
      id: turnId,
      input,
      toolCall: call,
      confirmRequired: false,
      confirmed: true,
      result,
      reply: result.ok
        ? result.summary
        : `That didn't work: ${result.error ?? result.summary}`,
      startedAt: pendingTurn.startedAt,
    });
  }

  private async conversationalReply(input: string): Promise<string> {
    if (this.engine) {
      try {
        const out = await this.engine.complete(
          `${buildChatPrompt('')}\n\nUser: ${input}\nVault:`,
          { maxTokens: 160, temperature: 0.7 },
        );
        const text = out.trim();
        if (text) return text;
      } catch {
        // fall through to deterministic reply
      }
    }
    return "I didn't quite catch that. You can ask me to remember something, set a reminder, schedule an event, or ask what I remember.";
  }

  private async recallReply(input: string, hits: RecallHit[]): Promise<string> {
    if (hits.length === 0) {
      return "I couldn't find anything about that in your memory yet.";
    }
    const context = hits.map((h, i) => `[${i + 1}] ${h.note.body}`).join('\n');
    if (this.engine) {
      try {
        const out = await this.engine.complete(
          `${buildChatPrompt(context)}\n\nUser request: ${input}\nAnswer using ONLY the memory above.\nVault:`,
          { maxTokens: 220, temperature: 0.3 },
        );
        const text = out.trim();
        if (text) return text;
      } catch {
        // fall through to deterministic listing
      }
    }
    const lines = hits.slice(0, 5).map((h) => `\u2022 ${h.note.body}`);
    return `Here's what I remember:\n${lines.join('\n')}`;
  }
}
