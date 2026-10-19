/**
 * Throughput spike — is a 3–4B model FAST ENOUGH and does it FIT in RAM on a
 * real phone? (Simulators lie about both. Run on hardware.)
 *
 * Measures: cold load time, tokens/second, and — critically on iOS — whether
 * the app survives generation without a jetsam (out-of-memory) kill.
 *
 * Feeds the v1 latency budgets in BUILD-PLAN §6.
 */
import { loadModel, complete, unload, type LoadedModel } from '@/inference/llama';
import { DEFAULT_SPIKE_MODEL } from '@/models/manifest';

export interface ThroughputReport {
  model: string;
  loadMs: number;
  runs: Array<{ prompt: string; tokens: number; tokensPerSecond: number; ms: number }>;
  avgTokensPerSecond: number;
  timeToFirstTokenMs: number;
}

const PROMPTS = [
  'Summarize in one sentence: I met Sara for coffee and we agreed to ship the beta by Friday.',
  'Draft a two-line reply thanking someone for lunch and suggesting next Tuesday.',
  'List three reminders someone planning a move might want.',
];

/** Qwen2.5 ChatML shape — matches the toolcall spike so tok/s measures real chat usage. */
function chatPrompt(user: string): string {
  return (
    `<|im_start|>system\nYou are Vault's helpful, concise on-device assistant.<|im_end|>\n` +
    `<|im_start|>user\n${user}<|im_end|>\n` +
    `<|im_start|>assistant\n`
  );
}

export async function runThroughputSpike(modelPath: string): Promise<ThroughputReport> {
  const model: LoadedModel = await loadModel(DEFAULT_SPIKE_MODEL, modelPath);
  const runs: ThroughputReport['runs'] = [];
  let firstTokenMs = 0;

  try {
    for (const prompt of PROMPTS) {
      const start = Date.now();
      let firstSeen = false;
      const r = await complete(model, chatPrompt(prompt), {
        maxTokens: 128,
        onToken: () => {
          if (!firstSeen) {
            firstSeen = true;
            firstTokenMs = Date.now() - start;
          }
        },
      });
      runs.push({ prompt: prompt.slice(0, 40) + '…', tokens: r.tokens, tokensPerSecond: r.tokensPerSecond, ms: r.ms });
    }
  } finally {
    await unload(model);
  }

  const avg = runs.reduce((s, r) => s + r.tokensPerSecond, 0) / runs.length;
  return {
    model: DEFAULT_SPIKE_MODEL,
    loadMs: model.loadMs,
    runs,
    avgTokensPerSecond: avg,
    timeToFirstTokenMs: firstTokenMs,
  };
}

/**
 * Reference bars (calibrate on real devices in Phase 0):
 *   - avgTokensPerSecond ≥ ~10 feels usable for chat/draft-back on mid-range.
 *   - timeToFirstTokenMs ≤ ~1500ms so it doesn't feel dead.
 *   - NO jetsam kill on a 6GB-RAM Android / older iPhone during generation.
 *     If it dies → drop to a smaller model / lower n_ctx / heavier quantization.
 */
