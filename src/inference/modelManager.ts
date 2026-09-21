/**
 * Model manifest + download manager for Vault's on-device models.
 *
 * Models live in <documentDirectory>/vault-models/ and are downloaded on
 * first run (never bundled with the app binary).
 */

import * as FileSystem from 'expo-file-system/legacy';

export interface ModelSpec {
  url: string;
  fileName: string;
  /** Approximate size in bytes (used for storage warnings). */
  bytes: number;
  /** Embedding dims (embed model only). */
  dims?: number;
}

export const CHAT_MODEL: ModelSpec = {
  url: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
  fileName: 'qwen2.5-3b-instruct-q4_k_m.gguf',
  bytes: 2_000_000_000,
};

/**
 * Embedding model. Verified 2026-09-20: the resolve URL returns HTTP 200
 * (HEAD, following redirects to HF's Xet CDN). Qwen3-Embedding-0.6B emits
 * 1024-dim vectors.
 *
 * If this ever becomes null/unavailable, recall falls back to FTS5-only —
 * see memory/index.ts resolveEmbedFn().
 */
export const EMBED_MODEL: ModelSpec = {
  url: 'https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf',
  fileName: 'Qwen3-Embedding-0.6B-Q8_0.gguf',
  dims: 1024,
  // Approximate: HF's Xet CDN does not advertise Content-Length (~0.6B params, Q8_0).
  bytes: 640_000_000,
};

export type ModelKind = 'chat' | 'embed';
export type ProgressCallback = (bytesWritten: number, totalBytes: number) => void;

const MODELS_DIR_NAME = 'vault-models/';

function specFor(kind: ModelKind): ModelSpec {
  const spec = kind === 'chat' ? CHAT_MODEL : EMBED_MODEL;
  if (!spec) throw new Error(`modelManager: no ${kind} model configured`);
  return spec;
}

function documentDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('modelManager: documentDirectory unavailable');
  return base;
}

/** Expected local path for a model kind (does not download). */
export async function getModelPath(kind: ModelKind): Promise<string> {
  return documentDir() + MODELS_DIR_NAME + specFor(kind).fileName;
}

export async function isModelDownloaded(kind: ModelKind): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(await getModelPath(kind));
  return info.exists === true;
}

/**
 * Download a model if not already present. Resolves to the local file path.
 * Progress callback receives (bytesWritten, totalBytes) — totalBytes may be
 * -1 when the server omits Content-Length.
 */
export async function downloadModel(
  kind: ModelKind,
  onProgress?: ProgressCallback,
): Promise<string> {
  const spec = specFor(kind);
  const dir = documentDir() + MODELS_DIR_NAME;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const path = dir + spec.fileName;

  const existing = await FileSystem.getInfoAsync(path);
  if (existing.exists) return path; // skip re-download

  const task = FileSystem.createDownloadResumable(spec.url, path, {}, (progress) => {
    onProgress?.(progress.totalBytesWritten, progress.totalBytesExpectedToWrite);
  });
  const result = await task.downloadAsync();
  return result?.uri ?? path;
}
