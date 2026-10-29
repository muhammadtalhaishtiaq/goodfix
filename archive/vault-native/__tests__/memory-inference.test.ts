/**
 * Tests for the inference + memory layers' pure/test-safe modules.
 *
 * Only pure.ts and mockEngine.ts are imported here — both are guaranteed
 * free of expo / react-native / llama.rn imports, so these run in plain node.
 */

import {
  blobToFloat32,
  cosineSimilarity,
  float32ToBlob,
  noteId,
  parseFrontmatter,
  serializeNote,
} from '../src/memory/pure';
import { MockEngine, mockEmbedVector } from '../src/inference/mockEngine';

describe('pure: frontmatter', () => {
  it('round-trips serialize -> parse', () => {
    const note = {
      id: 'abc123',
      createdAt: 1700000000000,
      updatedAt: 1700000001000,
      kind: 'reminder',
      body: 'Buy milk\ntomorrow at 9am',
    };
    const md = serializeNote(note);
    const { fields, body } = parseFrontmatter(md);
    expect(fields.id).toBe('abc123');
    expect(fields.createdAt).toBe('1700000000000');
    expect(fields.updatedAt).toBe('1700000001000');
    expect(fields.kind).toBe('reminder');
    expect(body).toBe('Buy milk\ntomorrow at 9am');
  });

  it('handles a body that itself contains --- lines', () => {
    const md = serializeNote({
      id: 'x',
      createdAt: 1,
      updatedAt: 1,
      kind: 'note',
      body: 'line one\n---\nline two',
    });
    const { fields, body } = parseFrontmatter(md);
    expect(fields.id).toBe('x');
    expect(body).toBe('line one\n---\nline two');
  });

  it('returns empty fields + whole string when no frontmatter', () => {
    const { fields, body } = parseFrontmatter('just a plain note');
    expect(fields).toEqual({});
    expect(body).toBe('just a plain note');
  });

  it('returns empty fields + whole string when frontmatter is unterminated', () => {
    const md = '---\nid: abc\nno closing fence here';
    const { fields, body } = parseFrontmatter(md);
    expect(fields).toEqual({});
    expect(body).toBe(md);
  });
});

describe('pure: float32 blob', () => {
  it('round-trips vectors through float32 LE bytes', () => {
    const vec = [1.5, -2.25, 0, 3.14159, 1e-7, -123456.789];
    const blob = float32ToBlob(vec);
    expect(blob).toBeInstanceOf(Uint8Array);
    expect(blob.byteLength).toBe(vec.length * 4);
    const back = blobToFloat32(blob);
    expect(back.length).toBe(vec.length);
    // float32 has ~7 significant digits; precision 2 keeps large magnitudes honest
    back.forEach((v, i) => expect(v).toBeCloseTo(vec[i], 2));
  });

  it('round-trips an empty vector', () => {
    expect(blobToFloat32(float32ToBlob([]))).toEqual([]);
  });
});

describe('pure: cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it('returns 0 for zero / mismatched / empty vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe('pure: noteId', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => noteId()));
    expect(ids.size).toBe(200);
  });

  it('matches the expected shape', () => {
    expect(noteId()).toMatch(/^[0-9a-z]+-[0-9a-f]{8}$/);
  });
});

describe('MockEngine', () => {
  const engine = new MockEngine();

  it('exposes the InferenceEngine surface', () => {
    expect(engine.name).toBe('mock');
    expect(engine.supportsEmbeddings).toBe(true);
    expect(engine.status().loaded).toBe(false);
  });

  it('tracks load/unload in status()', async () => {
    await engine.load('/tmp/fake.gguf');
    expect(engine.status()).toEqual({ loaded: true, path: '/tmp/fake.gguf' });
    await engine.unload();
    expect(engine.status().loaded).toBe(false);
  });

  it('returns canned tool JSON when the prompt mentions tools', async () => {
    const out = await engine.complete('You have "tools" available: [...]');
    const parsed = JSON.parse(out);
    expect(parsed.tool).toBe('save_note');
    expect(parsed.args.body).toBe('mock note');
  });

  it('returns canned tool JSON for the bare word "tool"', async () => {
    const parsed = JSON.parse(await engine.complete('use a tool now'));
    expect(parsed.tool).toBe('save_note');
  });

  it('returns a plain reply otherwise', async () => {
    await expect(engine.complete('Hello there')).resolves.toBe('Mock reply.');
  });

  it('embed() is deterministic with 384 dims', async () => {
    const a = await engine.embed('hello world');
    const b = await engine.embed('hello world');
    expect(a.dims).toBe(384);
    expect(a.vector).toHaveLength(384);
    expect(a.vector).toEqual(b.vector);
  });

  it('embed() differs across texts and matches mockEmbedVector', async () => {
    const a = await engine.embed('alpha');
    const b = await engine.embed('beta');
    expect(a.vector).not.toEqual(b.vector);
    expect(a.vector).toEqual(mockEmbedVector('alpha'));
    // unit length
    const norm = Math.sqrt(a.vector.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1, 10);
  });
});
