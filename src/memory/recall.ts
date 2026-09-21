/**
 * RecallEngine — merges vector (semantic) + FTS (keyword) hits into ranked
 * RecallHit[]. Never throws on a missing/broken embedding model: if embedFn
 * is null or fails, recall degrades to FTS-only; if that is empty too, the
 * 3 most recent notes are returned (method 'recent').
 */

import type { RecallHit } from './types';
import type { MdStore } from './mdStore';
import type { VectorIndex } from './vectorIndex';

export type EmbedFn = (text: string) => Promise<number[]>;

export class RecallEngine {
  constructor(
    private readonly store: Pick<MdStore, 'get' | 'list'>,
    private readonly index: VectorIndex,
    private readonly embedFn: EmbedFn | null,
  ) {}

  async recall(query: string, limit = 5): Promise<RecallHit[]> {
    const hits: RecallHit[] = [];
    const seen = new Set<string>();

    const pushHit = async (id: string, score: number, method: RecallHit['method']) => {
      if (seen.has(id)) return;
      const note = await this.store.get(id);
      if (!note) return;
      seen.add(id);
      hits.push({ note, score, method });
    };

    // 1. Semantic search when an embedding function is available.
    if (this.embedFn) {
      try {
        const vec = await this.embedFn(query);
        const vres = await this.index.searchVector(vec, limit * 2);
        for (const h of vres) {
          await pushHit(h.id, 1 / (1 + h.distance), 'vector');
        }
      } catch {
        // Fall through to FTS — recall must never throw on embed failures.
      }
    }

    // 2. Keyword search always runs too (fills gaps the vector search missed).
    try {
      const fres = await this.index.searchFts(query, limit * 2);
      for (const h of fres) {
        await pushHit(h.id, 0.5, 'fts');
      }
    } catch {
      // Fall through to recency.
    }

    // 3. Last resort: most recent notes.
    if (hits.length === 0) {
      const recent = await this.store.list(3, 0);
      for (const note of recent) {
        if (seen.has(note.id)) continue;
        seen.add(note.id);
        hits.push({ note, score: 0.1, method: 'recent' });
      }
    }

    return hits.slice(0, limit);
  }
}
