/**
 * VectorIndex — sqlite-vec (vec0) for semantic search + FTS5 for keyword
 * search, both backed by expo-sqlite.
 *
 * app.json enables the sqlite-vec extension, but we don't trust that at
 * runtime: vec0 table creation is wrapped in try/catch, and if it fails the
 * index degrades to FTS5-only (isVecAvailable() === false). Vector writes
 * are skipped in that mode; FTS writes always happen.
 */

import * as SQLite from 'expo-sqlite';
import { float32ToBlob } from './pure';

export interface VectorHit {
  id: string;
  distance: number;
}

export interface FtsHit {
  id: string;
  rank: number;
}

export class VectorIndex {
  private db: SQLite.SQLiteDatabase | null = null;
  private vecAvailable = false;

  constructor(private readonly dims: number) {}

  isVecAvailable(): boolean {
    return this.vecAvailable;
  }

  async init(db: SQLite.SQLiteDatabase): Promise<void> {
    this.db = db;
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS mem_vec_ids (note_id TEXT PRIMARY KEY, rowid INTEGER)',
    );
    try {
      await db.execAsync(
        `CREATE VIRTUAL TABLE IF NOT EXISTS mem_vec USING vec0(embedding float[${this.dims}])`,
      );
      this.vecAvailable = true;
    } catch {
      // sqlite-vec extension missing at runtime — FTS5-only mode.
      this.vecAvailable = false;
    }
    await db.execAsync('CREATE VIRTUAL TABLE IF NOT EXISTS mem_fts USING fts5(body, note_id UNINDEXED)');
  }

  private requireDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('VectorIndex: call init() first');
    return this.db;
  }

  /** Insert or replace a note's index entries. Vector may be null (FTS-only). */
  async upsert(noteId: string, body: string, vector: number[] | null): Promise<void> {
    const db = this.requireDb();
    await db.runAsync('DELETE FROM mem_fts WHERE note_id = ?', noteId);
    await db.runAsync('INSERT INTO mem_fts(body, note_id) VALUES (?, ?)', body, noteId);

    if (vector && this.vecAvailable) {
      if (vector.length !== this.dims) {
        throw new Error(`VectorIndex: expected ${this.dims} dims, got ${vector.length}`);
      }
      const existing = await db.getFirstAsync<{ rowid: number }>(
        'SELECT rowid FROM mem_vec_ids WHERE note_id = ?',
        noteId,
      );
      let rowid: number;
      if (existing) {
        rowid = existing.rowid;
      } else {
        await db.runAsync('INSERT INTO mem_vec_ids(note_id) VALUES (?)', noteId);
        const last = await db.getFirstAsync<{ rowid: number }>(
          'SELECT last_insert_rowid() AS rowid',
        );
        if (!last) throw new Error('VectorIndex: failed to allocate vec rowid');
        rowid = last.rowid;
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO mem_vec(rowid, embedding) VALUES (?, ?)',
        rowid,
        float32ToBlob(vector),
      );
    }
  }

  async remove(noteId: string): Promise<void> {
    const db = this.requireDb();
    await db.runAsync('DELETE FROM mem_fts WHERE note_id = ?', noteId);
    const existing = await db.getFirstAsync<{ rowid: number }>(
      'SELECT rowid FROM mem_vec_ids WHERE note_id = ?',
      noteId,
    );
    if (existing && this.vecAvailable) {
      await db.runAsync('DELETE FROM mem_vec WHERE rowid = ?', existing.rowid);
    }
    await db.runAsync('DELETE FROM mem_vec_ids WHERE note_id = ?', noteId);
  }

  /** Nearest neighbors by L2 distance over the stored embedding. */
  async searchVector(queryVec: number[], k: number): Promise<VectorHit[]> {
    const db = this.requireDb();
    if (!this.vecAvailable) return [];
    const rows = await db.getAllAsync<{ rowid: number; distance: number }>(
      'SELECT rowid, distance FROM mem_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?',
      float32ToBlob(queryVec),
      k,
    );
    const hits: VectorHit[] = [];
    for (const row of rows) {
      const mapped = await db.getFirstAsync<{ note_id: string }>(
        'SELECT note_id FROM mem_vec_ids WHERE rowid = ?',
        row.rowid,
      );
      if (mapped) hits.push({ id: mapped.note_id, distance: row.distance });
    }
    return hits;
  }

  /** Keyword search. Query is phrase-quoted so special chars can't break MATCH. */
  async searchFts(query: string, k: number): Promise<FtsHit[]> {
    const db = this.requireDb();
    const q = query.trim().replace(/"/g, '""');
    if (!q) return [];
    try {
      const rows = await db.getAllAsync<{ note_id: string; rank: number }>(
        'SELECT note_id, rank FROM mem_fts WHERE mem_fts MATCH ? ORDER BY rank LIMIT ?',
        `"${q}"`,
        k,
      );
      return rows.map((r) => ({ id: r.note_id, rank: r.rank }));
    } catch {
      return [];
    }
  }
}
