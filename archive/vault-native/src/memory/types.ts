/**
 * Memory layer contract. Source of truth = human-readable .md files in the
 * app's document directory (the user can open and read their own memory).
 * A vector index (sqlite-vec) + FTS5 keyword index make recall fast.
 */

export interface MemoryNote {
  id: string;
  /** Markdown body. */
  body: string;
  createdAt: number;
  updatedAt: number;
  /** 'note' | 'reminder' | 'event' | 'capture' */
  kind: string;
  /** Relative .md file path under the memory dir. */
  filePath: string;
}

export interface RecallHit {
  note: MemoryNote;
  /** 0..1 — higher is more relevant. */
  score: number;
  method: 'vector' | 'fts' | 'recent';
}

export interface MemoryStore {
  init(): Promise<void>;
  save(body: string, kind?: string): Promise<MemoryNote>;
  update(id: string, body: string): Promise<MemoryNote>;
  remove(id: string): Promise<void>;
  get(id: string): Promise<MemoryNote | null>;
  /** Newest-first list for the Memory screen. */
  list(limit?: number, offset?: number): Promise<MemoryNote[]>;
  /** Semantic + keyword recall. Never throws on missing embedding model. */
  recall(query: string, limit?: number): Promise<RecallHit[]>;
  /** Total note count (for diagnostics/privacy dashboard). */
  count(): Promise<number>;
}
