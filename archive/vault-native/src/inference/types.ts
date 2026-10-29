/**
 * Inference engine contract. The app talks to models ONLY through this
 * interface, so the llama.rn implementation, mocks, and future engines
 * (ExecuTorch, Core ML) are interchangeable.
 */

export interface CompletionOptions {
  /** Forced JSON mode: when set, the engine must return valid JSON. */
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  /** Stop sequences. */
  stop?: string[];
}

export interface EmbeddingResult {
  vector: number[];
  dims: number;
}

export interface ModelStatus {
  loaded: boolean;
  /** GGUF file path when loaded. */
  path?: string;
  /** Approx tokens/sec measured on this device (0 = unknown). */
  measuredTokPerSec?: number;
}

export interface InferenceEngine {
  readonly name: string;
  load(modelPath: string): Promise<void>;
  unload(): Promise<void>;
  status(): ModelStatus;
  /** Returns the raw text completion. */
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  /** Returns an embedding vector for the text. */
  embed(text: string): Promise<EmbeddingResult>;
  readonly supportsEmbeddings: boolean;
}
