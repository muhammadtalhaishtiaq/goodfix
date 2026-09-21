/**
 * MockEngine — deterministic stand-in for LlamaEngine.
 *
 * Used by jest and for UI development without a downloaded model.
 * No expo / llama.rn imports at top level (or at all): this module is
 * imported directly by tests and must load in plain node.
 */

import type {
  CompletionOptions,
  EmbeddingResult,
  InferenceEngine,
  ModelStatus,
} from './types';

const EMBED_DIMS = 384;

/** FNV-1a 32-bit hash — deterministic seed from text. */
function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random unit vector seeded by the text hash. */
export function mockEmbedVector(text: string, dims = EMBED_DIMS): number[] {
  let seed = hash32(text) || 1;
  const vector: number[] = [];
  for (let i = 0; i < dims; i++) {
    // xorshift32
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    vector.push((seed / 0xffffffff) * 2 - 1);
  }
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export class MockEngine implements InferenceEngine {
  readonly name = 'mock';
  readonly supportsEmbeddings = true;
  private loadedPath: string | undefined;

  async load(modelPath: string): Promise<void> {
    this.loadedPath = modelPath;
  }

  async unload(): Promise<void> {
    this.loadedPath = undefined;
  }

  status(): ModelStatus {
    return { loaded: this.loadedPath !== undefined, path: this.loadedPath };
  }

  async complete(prompt: string, _options?: CompletionOptions): Promise<string> {
    if (prompt.includes('"tools"') || prompt.includes('tool')) {
      return JSON.stringify({ tool: 'save_note', args: { body: 'mock note' } });
    }
    return 'Mock reply.';
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const vector = mockEmbedVector(text);
    return { vector, dims: vector.length };
  }
}
