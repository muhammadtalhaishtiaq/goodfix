/**
 * Memory spike — prove the trust-defining feature works: store a note as an
 * .md file in the user's own storage, index it in a LOCAL vector db, and recall
 * it by meaning (not keyword). All on-device, nothing leaves.
 *
 * Validates the .md-memory + sqlite-vec decision (DECISIONS.md 2026-07-16).
 *
 * ⚠️ Phase 0: sqlite-vec must build on BOTH platforms via expo-sqlite. If the
 * vec extension won't load, fall back to an in-JS cosine search over a small
 * set, or ObjectBox. Confirm here before relying on it.
 *
 * ⚠️ KNOWN (2026-08-29): expo-sqlite on SDK 52 does NOT ship the `vec0` sqlite-vec
 * extension by default, so `vec_version()` likely throws → `vecExtensionLoaded`
 * will be `false` and the spike records "not tested" rather than failing hard.
 * That is the intended graceful degradation: the PRIMARY Phase 0 gate is the
 * tool-calling spike (toolcall.spike.ts); memory/vector is secondary. To truly
 * test vec on-device we'd need to bundle sqlite-vec as a native extension —
 * deferred; do NOT block the gate on it.
 */
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { loadModel, unload, type LoadedModel } from '@/inference/llama';
import { DEFAULT_SPIKE_MODEL } from '@/models/manifest';

const MEMORY_DIR = FileSystem.documentDirectory + 'memory/';

/** Where the user's own readable .md notes live — the source of truth. */
async function writeNote(id: string, text: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(MEMORY_DIR, { intermediates: true }).catch(() => {});
  const path = `${MEMORY_DIR}${id}.md`;
  await FileSystem.writeAsStringAsync(path, text);
  return path;
}

/**
 * Embed text on-device. In Phase 0 this can reuse the chat model's embedding
 * endpoint (llama.rn `embedding()`) or a dedicated small embed model
 * (EmbeddingGemma-300m). Returns a Float32 vector.
 */
async function embed(model: LoadedModel, text: string): Promise<number[]> {
  const res = await (model.ctx as unknown as { embedding: (t: string) => Promise<{ embedding: number[] }> }).embedding(text);
  return res.embedding;
}

interface RecallHit {
  id: string;
  path: string;
  score: number;
  preview: string;
}

export interface MemoryReport {
  vecExtensionLoaded: boolean;
  stored: number;
  query: string;
  hits: RecallHit[];
  ok: boolean;
}

const SAMPLE_NOTES: Array<{ id: string; text: string }> = [
  { id: 'n1', text: 'Berlin trip is booked for September 12–18. Staying in Kreuzberg.' },
  { id: 'n2', text: 'Landlord is Mr. Okoro, rent due on the 1st, contact via WhatsApp.' },
  { id: 'n3', text: 'Wifi password at the office is hunter2-guest.' },
  { id: 'n4', text: 'Sara prefers oat milk. Her birthday is March 4.' },
];

export async function runMemorySpike(modelPath: string, query = 'when am I going to Germany?'): Promise<MemoryReport> {
  const model: LoadedModel = await loadModel(DEFAULT_SPIKE_MODEL, modelPath);
  const db = await SQLite.openDatabaseAsync('vault-memory.db');
  let vecLoaded = false;

  try {
    // Attempt to load sqlite-vec. If unavailable, this throws → we record it.
    try {
      await db.execAsync('SELECT vec_version();');
      vecLoaded = true;
    } catch {
      vecLoaded = false;
    }

    // 384 dims = all-MiniLM / EmbeddingGemma-small. Adjust to the chosen embed model.
    if (vecLoaded) {
      await db.execAsync(
        `CREATE VIRTUAL TABLE IF NOT EXISTS mem_vec USING vec0(id TEXT PRIMARY KEY, embedding FLOAT[384]);`
      );
    }

    // Store: .md file (source of truth) + vector (index).
    for (const note of SAMPLE_NOTES) {
      const path = await writeNote(note.id, note.text);
      if (vecLoaded) {
        const v = await embed(model, note.text);
        await db.runAsync('INSERT OR REPLACE INTO mem_vec(id, embedding) VALUES (?, ?)', note.id, JSON.stringify(v));
      }
      void path;
    }

    // Recall by meaning.
    const hits: RecallHit[] = [];
    if (vecLoaded) {
      const qv = await embed(model, query);
      const rows = await db.getAllAsync<{ id: string; distance: number }>(
        `SELECT id, distance FROM mem_vec WHERE embedding MATCH ? ORDER BY distance LIMIT 3`,
        JSON.stringify(qv)
      );
      for (const row of rows) {
        const note = SAMPLE_NOTES.find((n) => n.id === row.id);
        hits.push({ id: row.id, path: `${MEMORY_DIR}${row.id}.md`, score: 1 - row.distance, preview: note?.text.slice(0, 60) ?? '' });
      }
    }

    // Success = top hit is the Berlin note for a "Germany" query (semantic, not keyword).
    const ok = vecLoaded && hits[0]?.id === 'n1';
    return { vecExtensionLoaded: vecLoaded, stored: SAMPLE_NOTES.length, query, hits, ok };
  } finally {
    await db.closeAsync();
    await unload(model);
  }
}
