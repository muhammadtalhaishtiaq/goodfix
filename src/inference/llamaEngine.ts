/**
 * LlamaEngine — InferenceEngine backed by llama.rn (llama.cpp on-device).
 *
 * llama.rn is a native module: it is NEVER imported at module top-level here.
 * The dynamic `await import('llama.rn')` inside load() keeps jest (and any
 * non-device bundling) from ever loading the native module.
 */

import type { LlamaContext } from 'llama.rn';
import type {
  CompletionOptions,
  EmbeddingResult,
  InferenceEngine,
  ModelStatus,
} from './types';

export class LlamaEngine implements InferenceEngine {
  readonly name = 'llama.rn';
  readonly supportsEmbeddings = true;

  private ctx: LlamaContext | null = null;
  private modelPath: string | undefined;
  private tokPerSec = 0;

  async load(modelPath: string): Promise<void> {
    if (this.ctx) await this.unload();
    // Lazy import: keeps the native module out of jest / non-device bundles.
    const { initLlama } = await import('llama.rn');
    this.ctx = await initLlama({ model: modelPath, n_ctx: 2048, n_threads: 4 });
    this.modelPath = modelPath;
  }

  async unload(): Promise<void> {
    if (this.ctx) {
      await this.ctx.release();
      this.ctx = null;
    }
    this.modelPath = undefined;
  }

  status(): ModelStatus {
    return {
      loaded: this.ctx !== null,
      path: this.modelPath,
      measuredTokPerSec: this.tokPerSec,
    };
  }

  private requireCtx(): LlamaContext {
    if (!this.ctx) throw new Error('LlamaEngine: call load() before complete()/embed()');
    return this.ctx;
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const ctx = this.requireCtx();
    const params: {
      prompt: string;
      n_predict: number;
      temperature: number;
      stop?: string[];
      response_format?: { type: 'json_schema'; json_schema: { schema: Record<string, unknown> } };
    } = {
      prompt,
      n_predict: options.maxTokens ?? 256,
      temperature: options.temperature ?? 0.2,
    };
    if (options.stop) params.stop = options.stop;
    if (options.jsonSchema) {
      params.response_format = {
        type: 'json_schema',
        json_schema: { schema: options.jsonSchema },
      };
    }
    const result = await ctx.completion(params);
    return result.text;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const ctx = this.requireCtx();
    const result = await ctx.embedding(text);
    return { vector: result.embedding, dims: result.embedding.length };
  }
}
