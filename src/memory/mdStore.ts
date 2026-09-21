/**
 * MdStore — the .md files are the source of truth for Vault memory.
 *
 * Notes live at <documentDirectory>/vault-memory/<id>.md with YAML-ish
 * frontmatter, so the user can literally open and read their own memory.
 * A vector index + FTS5 table (vectorIndex.ts) make recall fast; this class
 * only owns the files.
 */

import * as FileSystem from 'expo-file-system/legacy';
import type { MemoryNote } from './types';
import { noteId, parseFrontmatter, serializeNote } from './pure';

const MEMORY_DIR_NAME = 'vault-memory/';

export class MdStore {
  private dir: string | null = null;

  async init(): Promise<void> {
    const base = FileSystem.documentDirectory;
    if (!base) throw new Error('MdStore: documentDirectory unavailable');
    this.dir = base + MEMORY_DIR_NAME;
    await FileSystem.makeDirectoryAsync(this.dir, { intermediates: true });
  }

  private requireDir(): string {
    if (!this.dir) throw new Error('MdStore: call init() first');
    return this.dir;
  }

  private fullPath(id: string): string {
    return this.requireDir() + `${id}.md`;
  }

  async save(body: string, kind = 'note'): Promise<MemoryNote> {
    const id = noteId();
    const now = Date.now();
    const note: MemoryNote = {
      id,
      body,
      createdAt: now,
      updatedAt: now,
      kind,
      filePath: `${id}.md`,
    };
    await FileSystem.writeAsStringAsync(this.fullPath(id), serializeNote(note));
    return note;
  }

  async get(id: string): Promise<MemoryNote | null> {
    const info = await FileSystem.getInfoAsync(this.fullPath(id));
    if (!info.exists) return null;
    const md = await FileSystem.readAsStringAsync(this.fullPath(id));
    const { fields, body } = parseFrontmatter(md);
    const createdAt = Number(fields.createdAt) || 0;
    return {
      id: fields.id || id,
      body,
      createdAt,
      updatedAt: Number(fields.updatedAt) || createdAt,
      kind: fields.kind || 'note',
      filePath: `${id}.md`,
    };
  }

  /** Newest-first. */
  async list(limit = 50, offset = 0): Promise<MemoryNote[]> {
    const names = await FileSystem.readDirectoryAsync(this.requireDir());
    const notes: MemoryNote[] = [];
    for (const name of names) {
      if (!name.endsWith('.md')) continue;
      const note = await this.get(name.slice(0, -3));
      if (note) notes.push(note);
    }
    notes.sort((a, b) => b.createdAt - a.createdAt);
    return notes.slice(offset, offset + limit);
  }

  async update(id: string, body: string): Promise<MemoryNote> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`MdStore: note not found: ${id}`);
    const note: MemoryNote = { ...existing, body, updatedAt: Date.now() };
    await FileSystem.writeAsStringAsync(this.fullPath(id), serializeNote(note));
    return note;
  }

  async remove(id: string): Promise<void> {
    await FileSystem.deleteAsync(this.fullPath(id), { idempotent: true });
  }

  async count(): Promise<number> {
    const names = await FileSystem.readDirectoryAsync(this.requireDir());
    return names.filter((n) => n.endsWith('.md')).length;
  }

  /** All note bodies, for (re)building the vector index. */
  async getAllBodies(): Promise<Array<{ id: string; body: string }>> {
    const notes = await this.list(Number.MAX_SAFE_INTEGER, 0);
    return notes.map((n) => ({ id: n.id, body: n.body }));
  }
}
