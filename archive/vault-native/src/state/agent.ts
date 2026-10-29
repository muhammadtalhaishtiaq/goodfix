/**
 * src/state/agent.ts — singleton wiring for the Vault agent stack.
 *
 * One place builds the whole pipeline: inference engine → memory →
 * tool registry → audit → orchestrator. Everything is dynamically imported
 * inside functions so this module (and its importers) compile and load even
 * while the sibling modules are still being built in parallel.
 *
 * NOTE (path correction): the wiring spec wrote these imports as
 * '../../inference/...' — from src/state/ the correct prefix is '../'.
 */
import type { MemoryStore } from '../memory/types';

/** The orchestrator contract (built by the agent-core agent). */
export interface OrchestratorLike {
  turn(input: string): Promise<{
    id: string;
    input: string;
    reply: string;
    confirmRequired: boolean;
    actionKind?: string;
    toolCall: { tool: string; args: Record<string, unknown> } | null;
  }>;
  confirm(turnId: string, approved: boolean): Promise<{ reply: string }>;
}

/** UI-facing turn: raw orchestrator turn mapped to the Home-screen contract. */
export interface UiTurn {
  reply: string;
  confirmRequired: boolean;
  confirmPrompt?: string;
  /** Kind of the pending action (tool name) — drives "always allow". */
  actionKind?: string;
  approve: () => Promise<{ reply: string }>;
  reject: () => Promise<{ reply: string }>;
}

class AgentFacade {
  constructor(private readonly orch: OrchestratorLike) {}

  async turn(input: string): Promise<UiTurn> {
    const t = await this.orch.turn(input);
    const { buildConfirmPrompt } = await import('../agent/orchestrator');
    const confirmPrompt =
      t.confirmRequired && t.toolCall
        ? buildConfirmPrompt(
            t.toolCall.tool as 'create_reminder' | 'create_event',
            t.toolCall.args,
          )
        : undefined;
    const turnId = t.id;
    return {
      reply: t.reply,
      confirmRequired: t.confirmRequired,
      confirmPrompt,
      // Forward the pending action's kind so Home can park it on the
      // PendingConfirm and the "always allow" checkbox can render. The
      // orchestrator sets actionKind when it parks an action; fall back
      // to the parked call's tool name for older orchestrator shapes.
      actionKind:
        t.actionKind ??
        (t.confirmRequired && t.toolCall ? t.toolCall.tool : undefined),
      approve: () =>
        this.orch.confirm(turnId, true).then((r) => ({ reply: r.reply })),
      reject: () =>
        this.orch.confirm(turnId, false).then((r) => ({ reply: r.reply })),
    };
  }
}

let engineCache: any = null;
let memoryCache: MemoryStore | null = null;
let agentCache: OrchestratorLike | null = null;

/** On-device model when downloaded, otherwise the deterministic mock. */
export async function getEngine(): Promise<any> {
  if (engineCache) return engineCache;
  const { isModelDownloaded, getModelPath } = await import('../inference/modelManager');
  if (await isModelDownloaded('chat')) {
    const path = await getModelPath('chat');
    const { LlamaEngine } = await import('../inference/llamaEngine');
    const engine = new LlamaEngine();
    try {
      await engine.load(path);
      engineCache = engine;
    } catch {
      // Model file present but unloadable (corrupt / OOM): stay functional.
      const { MockEngine } = await import('../inference/mockEngine');
      engineCache = new MockEngine();
    }
  } else {
    const { MockEngine } = await import('../inference/mockEngine');
    engineCache = new MockEngine();
  }
  return engineCache;
}

/** Initialized on-device memory (`.md` files + local index). */
export async function getMemory(): Promise<MemoryStore> {
  if (memoryCache) return memoryCache;
  const { VaultMemory } = await import('../memory/index');
  const mem = new VaultMemory();
  await mem.init();
  memoryCache = mem;
  return mem;
}

/** The fully wired agent. Cached — the whole app shares one instance. */
export async function getAgent(): Promise<OrchestratorLike> {
  if (agentCache) return agentCache;
  const memory = await getMemory();
  const engine = await getEngine();
  const { buildToolRegistry } = await import('../tools/registry');
  const { append } = await import('../privacy/auditLog');

  const registry = buildToolRegistry({
    memory,
    recall: (q: string) => memory.recall(q),
  });
  const audit = (e: any) => append({ ...e, ts: Date.now() });
  // No ToolExecutor here: the orchestrator runs confirmed calls through
  // ToolExecutor internally (see Orchestrator.confirm).

  // @ts-ignore — src/agent/orchestrator.ts is built by the agent-core agent; resolved at runtime
  const { Orchestrator } = await import('../agent/orchestrator');
  const orch = new Orchestrator({ engine, memory, tools: registry, audit });
  agentCache = new AgentFacade(orch) as unknown as OrchestratorLike;
  return agentCache;
}

/** One conversational turn with approve/reject handles for confirmations. */
export async function agentTurn(input: string): Promise<UiTurn> {
  const agent = await getAgent();
  return agent.turn(input) as unknown as Promise<UiTurn>;
}
