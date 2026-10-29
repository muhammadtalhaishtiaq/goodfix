/**
 * VaultMemory — the MemoryStore implementation.
 *
 * Composes MdStore (.md files = source of truth) + VectorIndex (vec0 + FTS5)
 * + RecallEngine (vector + keyword + recency merge).
 *
 * Embeddings are lazy: they are only computed when the embedding model file
 * is actually present on disk (see modelManager). Without it, embedFn is
 * null and recall degrades gracefully to FTS5-only — recall() never throws
 * for a missing model.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import type { MemoryNote, MemoryStore, RecallHit } from './types';
import { MdStore } from './mdStore';
import { VectorIndex } from './vectorIndex';
import { RecallEngine, type EmbedFn } from './recall';
import { LlamaEngine } from '../inference/llamaEngine';
import { EMBED_MODEL, getModelPath } from '../inference/modelManager';

const DB_NAME = 'vault.db';
const DEFAULT_DIMS = 1024;

export class VaultMemory implements MemoryStore {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly md = new MdStore();
  private index: VectorIndex | null = null;
  private recallEngine: RecallEngine | null = null;
  private embedEngine: LlamaEngine | null = null;
  private embedFn: EmbedFn | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    this.db = db;
    await this.md.init();

    const dims = EMBED_MODEL?.dims ?? DEFAULT_DIMS;
    this.index = new VectorIndex(dims);
    await this.index.init(db);

    this.embedFn = await this.resolveEmbedFn();
    this.recallEngine = new RecallEngine(this.md, this.index, this.embedFn);
    this.initialized = true;
  }

  /**
   * Returns an embed function only when the embedding model file exists on
   * disk. Otherwise null → FTS5-only recall. Never throws.
   */
  private async resolveEmbedFn(): Promise<EmbedFn | null> {
    if (!EMBED_MODEL) return null;
    let path: string;
    try {
      path = await getModelPath('embed');
    } catch {
      return null;
    }
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;

    return async (text: string): Promise<number[]> => {
      if (!this.embedEngine) {
        this.embedEngine = new LlamaEngine();
        await this.embedEngine.load(path);
      }
      const result = await this.embedEngine.embed(text);
      return result.vector;
    };
  }

  private requireInit(): { index: VectorIndex; recall: RecallEngine } {
    if (!this.initialized || !this.index || !this.recallEngine) {
      throw new Error('VaultMemory: call init() first');
    }
    return { index: this.index, recall: this.recallEngine };
  }

  /** Embed a body for indexing; null when embeddings are unavailable/fail. */
  private async embedBody(body: string): Promise<number[] | null> {
    if (!this.embedFn) return null;
    try {
      return await this.embedFn(body);
    } catch {
      return null;
    }
  }

  async save(body: string, kind = 'note'): Promise<MemoryNote> {
    const { index } = this.requireInit();
    const note = await this.md.save(body, kind);
    await index.upsert(note.id, body, await this.embedBody(body));
    return note;
  }

  async update(id: string, body: string): Promise<MemoryNote> {
    const { index } = this.requireInit();
    const note = await this.md.update(id, body);
    await index.upsert(note.id, body, await this.embedBody(body));
    return note;
  }

  async remove(id: string): Promise<void> {
    const { index } = this.requireInit();
    await this.md.remove(id);
    await index.remove(id);
  }

  async get(id: string): Promise<MemoryNote | null> {
    this.requireInit();
    return this.md.get(id);
  }

  async list(limit = 50, offset = 0): Promise<MemoryNote[]> {
    this.requireInit();
    return this.md.list(limit, offset);
  }

  async recall(query: string, limit = 5): Promise<RecallHit[]> {
    const { recall } = this.requireInit();
    return recall.recall(query, limit);
  }

  async count(): Promise<number> {
    this.requireInit();
    return this.md.count();
  }

  /** For the privacy dashboard: is semantic recall active? */
  isSemanticRecallAvailable(): boolean {
    return this.embedFn !== null && (this.index?.isVecAvailable() ?? false);
  }
}
