/**
 * Privacy audit log — append-only JSONL file in the app's document directory.
 * Every tool run writes one entry here, so the user can always see exactly
 * what the app did. In v0.1 there is no cloud tier, so leftDevice is ALWAYS
 * false — it is recorded anyway so the privacy dashboard can prove it.
 */
import * as FileSystem from 'expo-file-system/legacy';
import type { PrivacyTier } from '../agent/types';

export interface AuditEntry {
  /** Unix epoch ms. */
  ts: number;
  tool: string;
  summary: string;
  tier: PrivacyTier;
  /** v0.1: always false (no cloud). Recorded anyway as proof. */
  leftDevice: boolean;
  detail?: string;
}

const AUDIT_DIR = 'vault-audit/';
const AUDIT_FILE = 'audit.jsonl';

function auditDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('auditLog: no document directory available');
  return base + AUDIT_DIR;
}

function auditPath(): string {
  return auditDir() + AUDIT_FILE;
}

async function ensureDir(): Promise<void> {
  const dir = auditDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function readRaw(): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(auditPath());
  } catch {
    return '';
  }
}

/** Append one entry. leftDevice is forced false in v0.1 (local-only build). */
export async function append(entry: Omit<AuditEntry, 'ts' | 'leftDevice'> & {
  ts?: number;
  leftDevice?: boolean;
}): Promise<void> {
  await ensureDir();
  const full: AuditEntry = {
    ts: entry.ts ?? Date.now(),
    tool: entry.tool,
    summary: entry.summary,
    tier: entry.tier,
    leftDevice: false, // v0.1 has no cloud tier — record the guarantee
    detail: entry.detail,
  };
  const raw = await readRaw();
  await FileSystem.writeAsStringAsync(auditPath(), raw + JSON.stringify(full) + '\n');
}

/** Newest-first parsed entries. Corrupt lines are skipped, never fatal. */
export async function list(limit = 100): Promise<AuditEntry[]> {
  const raw = await readRaw();
  const entries: AuditEntry[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as AuditEntry);
    } catch {
      // skip corrupt line
    }
  }
  return entries.slice(-limit).reverse();
}

/** Wipe the audit log (user-controlled export/delete feature). */
export async function clear(): Promise<void> {
  const info = await FileSystem.getInfoAsync(auditPath());
  if (info.exists) {
    await FileSystem.deleteAsync(auditPath());
  }
}
