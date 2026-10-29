/**
 * ★ THE MAKE-OR-BREAK SPIKE ★
 *
 * Question it answers: can our on-device small model, running on a REAL phone,
 * reliably turn a plain-language request into a valid, correct tool call?
 *
 * This single number decides the whole product's shape. If it's high, the model
 * can drive real automations. If it's low, we lean harder on deterministic
 * scaffolding and escalate anything agentic. Either way we must KNOW it before
 * building features — this is the Phase 0 gate in BUILD-PLAN §5.
 *
 * Method: fixed set of labeled requests → force JSON tool-calls → score each on
 * (a) valid JSON, (b) correct tool chosen, (c) correct arguments extracted.
 * Report success rate. Run it on the flagship AND a mid-range device.
 */
import { loadModel, completeJson, unload, type LoadedModel } from '@/inference/llama';
import { DEFAULT_SPIKE_MODEL } from '@/models/manifest';

/** The tiny, bounded tool set the agent may call. Small on purpose — reliability scales inversely with tool count. */
const TOOLS = ['create_reminder', 'create_event', 'save_note', 'recall_memory', 'none'] as const;
type ToolName = (typeof TOOLS)[number];

/** Forced-output schema: the model can ONLY produce this shape. */
const TOOL_CALL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tool', 'args'],
  properties: {
    tool: { type: 'string', enum: TOOLS },
    args: {
      type: 'object',
      additionalProperties: true,
      properties: {
        title: { type: 'string' },
        datetime_iso: { type: 'string' },
        body: { type: 'string' },
        query: { type: 'string' },
      },
    },
  },
} as const;

interface ToolCall {
  tool: ToolName;
  args: Record<string, unknown>;
}

/** Labeled eval set — expand to ~50 for a real signal. `expect` is the correct tool. */
interface Case {
  request: string;
  expectTool: ToolName;
  /** Optional arg check: which arg keys must be present + non-empty. */
  expectArgs?: string[];
}
const CASES: Case[] = [
  { request: 'Remind me to call the dentist tomorrow at 9am', expectTool: 'create_reminder', expectArgs: ['title', 'datetime_iso'] },
  { request: 'Set up a meeting with Sara on Friday 3pm', expectTool: 'create_event', expectArgs: ['title', 'datetime_iso'] },
  { request: 'Note that the wifi password is hunter2', expectTool: 'save_note', expectArgs: ['body'] },
  { request: 'What did I say about the Berlin trip?', expectTool: 'recall_memory', expectArgs: ['query'] },
  { request: 'Ping me to take medicine every night at 10', expectTool: 'create_reminder', expectArgs: ['title', 'datetime_iso'] },
  { request: 'Save this: parking spot is level 3, section B', expectTool: 'save_note', expectArgs: ['body'] },
  { request: 'Do I have anything written down about my landlord?', expectTool: 'recall_memory', expectArgs: ['query'] },
  { request: 'Tell me a joke', expectTool: 'none' },
  { request: 'Block my calendar for a dentist appointment next Monday morning', expectTool: 'create_event', expectArgs: ['title', 'datetime_iso'] },
  { request: 'How are you today?', expectTool: 'none' },
  // TODO Phase 0: grow to ~50 across all tools + tricky/ambiguous phrasings.
];

function buildPrompt(request: string, nowIso: string): string {
  // Chat template is model-specific; this is the Qwen2.5 ChatML shape. Adjust per model.
  const system =
    `You are Vault's on-device router. Turn the user's request into ONE tool call.\n` +
    `Tools: create_reminder(title, datetime_iso), create_event(title, datetime_iso), ` +
    `save_note(body), recall_memory(query), none.\n` +
    `Resolve relative dates against NOW=${nowIso}. Output ONLY the JSON tool call.`;
  return (
    `<|im_start|>system\n${system}<|im_end|>\n` +
    `<|im_start|>user\n${request}<|im_end|>\n` +
    `<|im_start|>assistant\n`
  );
}

export interface SpikeReport {
  model: string;
  n: number;
  parseOkRate: number; // valid JSON produced
  toolCorrectRate: number; // right tool chosen
  argsCorrectRate: number; // required args present + non-empty
  avgLatencyMs: number;
  perCase: Array<{ request: string; ok: boolean; got: string; latencyMs: number; note: string }>;
}

/**
 * Run the eval. `modelPath` = local path to the downloaded GGUF (from the
 * download step / manual push during Phase 0).
 */
export async function runToolCallSpike(modelPath: string): Promise<SpikeReport> {
  const model: LoadedModel = await loadModel(DEFAULT_SPIKE_MODEL, modelPath);
  const nowIso = new Date().toISOString();
  const perCase: SpikeReport['perCase'] = [];
  let parseOk = 0;
  let toolOk = 0;
  let argsOk = 0;
  let totalMs = 0;

  try {
    for (const c of CASES) {
      const { value, raw, ms, parseOk: pOk } = await completeJson<ToolCall>(
        model,
        buildPrompt(c.request, nowIso),
        TOOL_CALL_SCHEMA
      );
      totalMs += ms;
      let note = '';
      const tOk = pOk && value?.tool === c.expectTool;
      let aOk = false;
      if (tOk && c.expectArgs) {
        aOk = c.expectArgs.every((k) => {
          const v = value?.args?.[k];
          return typeof v === 'string' ? v.trim().length > 0 : v != null;
        });
        if (!aOk) note = `missing/empty args: ${c.expectArgs.join(',')}`;
      } else if (tOk) {
        aOk = true; // no args required (e.g. 'none')
      } else if (!pOk) {
        note = 'invalid JSON';
      } else {
        note = `wrong tool: got ${value?.tool}, want ${c.expectTool}`;
      }

      if (pOk) parseOk++;
      if (tOk) toolOk++;
      if (aOk) argsOk++;
      perCase.push({ request: c.request, ok: tOk && aOk, got: raw.slice(0, 120), latencyMs: ms, note });
    }
  } finally {
    await unload(model); // always free native memory
  }

  const n = CASES.length;
  return {
    model: DEFAULT_SPIKE_MODEL,
    n,
    parseOkRate: parseOk / n,
    toolCorrectRate: toolOk / n,
    argsCorrectRate: argsOk / n,
    avgLatencyMs: totalMs / n,
    perCase,
  };
}

/**
 * GATE (BUILD-PLAN §5, Phase 0):
 *   - parseOkRate should be ~1.0 (forced JSON — if not, the schema/grammar path is broken).
 *   - toolCorrectRate + argsCorrectRate are the real signal.
 *   - Set the pass bar HERE once we see real device numbers. Below bar →
 *     shrink the tool set, tighten prompts, or make routing deterministic
 *     BEFORE building features. Do not skip this gate.
 */
export const GATE = {
  minToolCorrectRate: 0.9, // provisional; calibrate on first real run
  minArgsCorrectRate: 0.85,
};
