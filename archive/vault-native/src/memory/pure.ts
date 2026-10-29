/**
 * Pure helpers for the memory layer.
 *
 * NO expo / react-native / native imports in this module — it is imported
 * directly by jest, which has no native runtime. Keep it that way.
 */

export interface NoteFields {
  id: string;
  createdAt: number;
  updatedAt: number;
  kind: string;
}

export interface ParsedNote {
  fields: Record<string, string>;
  body: string;
}

/**
 * Split a .md note into frontmatter fields + body. Notes without frontmatter
 * parse to empty fields and the whole string as body (never throws).
 */
export function parseFrontmatter(md: string): ParsedNote {
  if (!md.startsWith('---')) return { fields: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if (end === -1) return { fields: {}, body: md };
  const fields: Record<string, string> = {};
  for (const line of md.slice(3, end).trim().split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  let rest = md.slice(end + 4); // drop the '\n---' fence
  // Consume the blank-line separator serializeNote() writes ('---\n\n'),
  // tolerating a missing blank line.
  if (rest.startsWith('\n\n')) rest = rest.slice(2);
  else if (rest.startsWith('\n')) rest = rest.slice(1);
  return { fields, body: rest };
}

/** Serialize a note to the canonical .md format (the user-readable source of truth). */
export function serializeNote(note: NoteFields & { body: string }): string {
  return (
    `---\n` +
    `id: ${note.id}\n` +
    `createdAt: ${note.createdAt}\n` +
    `updatedAt: ${note.updatedAt}\n` +
    `kind: ${note.kind}\n` +
    `---\n\n` +
    note.body
  );
}

/** Pack a float vector as little-endian float32 bytes (for sqlite-vec vec0 blobs). */
export function float32ToBlob(vec: number[]): Uint8Array {
  const buf = new ArrayBuffer(vec.length * 4);
  const view = new DataView(buf);
  for (let i = 0; i < vec.length; i++) view.setFloat32(i * 4, vec[i], true);
  return new Uint8Array(buf);
}

/** Unpack little-endian float32 bytes back to a number vector. */
export function blobToFloat32(bytes: Uint8Array): number[] {
  const out: number[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i + 4 <= bytes.byteLength; i += 4) out.push(view.getFloat32(i, true));
  return out;
}

/** Cosine similarity in [-1, 1]. Returns 0 for mismatched/empty/zero vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Unique note id: base36 timestamp + 8 random hex chars. */
export function noteId(): string {
  const rand = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
  return `${Date.now().toString(36)}-${rand}`;
}
