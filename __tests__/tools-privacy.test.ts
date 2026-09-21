/**
 * tools-privacy.test.ts — tests for the tools + privacy + escalation layers.
 *
 * No expo native modules are imported at top level: expo-file-system/legacy
 * is mocked in-memory via jest.mock, and the executor test uses a fake
 * registry (no native imports at all).
 */

// ── In-memory expo-file-system/legacy mock ────────────────────────────────
const fsStore: Record<string, string> = {};

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock-documents/',
  getInfoAsync: async (uri: string) => ({ exists: uri in fsStore, uri }),
  makeDirectoryAsync: async (uri: string) => {
    fsStore[uri] = '';
  },
  writeAsStringAsync: async (uri: string, contents: string) => {
    fsStore[uri] = contents;
  },
  readAsStringAsync: async (uri: string) => {
    if (!(uri in fsStore)) throw new Error('file not found: ' + uri);
    return fsStore[uri];
  },
  deleteAsync: async (uri: string) => {
    delete fsStore[uri];
  },
}));

import type { PrivacyTier, ToolCall, ToolName } from '../src/agent/types';
import { append, clear, list } from '../src/privacy/auditLog';
import { assertLocalOnly } from '../src/privacy/networkGuard';
import { ToolExecutor } from '../src/tools/executor';
import { SIDE_EFFECTING } from '../src/tools/registry';
import type { ToolDefinition } from '../src/tools/types';

beforeEach(() => {
  for (const k of Object.keys(fsStore)) delete fsStore[k];
});

// ── networkGuard ──────────────────────────────────────────────────────────
describe('assertLocalOnly', () => {
  const allowed = [
    'https://huggingface.co/qwen/model.gguf',
    'https://cdn-lfs.huggingface.co/some/file',
    'https://cas-bridge.xethub.huggingface.co/xet/file',
    'https://cdn-lfs.hf.co/model.gguf',
    'HTTPS://HUGGINGFACE.CO/UPPER',
  ];
  test.each(allowed)('allows %s', (url) => {
    expect(() => assertLocalOnly(url)).not.toThrow();
  });

  const blocked = [
    'https://api.openai.com/v1/chat',
    'https://evil-huggingface.co/model.gguf',
    'https://huggingface.co.evil.com/x',
    'https://hf.co/model.gguf', // bare hf.co is not in the *.hf.co pattern
    'not a url at all',
  ];
  test.each(blocked)('blocks %s', (url) => {
    expect(() => assertLocalOnly(url)).toThrow(/networkGuard/);
  });
});

// ── auditLog ──────────────────────────────────────────────────────────────
describe('auditLog', () => {
  test('append + list round-trip, newest first', async () => {
    await append({ tool: 'save_note', summary: 'first', tier: 'local' });
    await append({ tool: 'create_reminder', summary: 'second', tier: 'local' });

    const entries = await list();
    expect(entries).toHaveLength(2);
    expect(entries[0]!.summary).toBe('second');
    expect(entries[1]!.summary).toBe('first');
    expect(typeof entries[0]!.ts).toBe('number');
  });

  test('leftDevice is always false in v0.1, even if a caller passes true', async () => {
    await append({ tool: 'save_note', summary: 'x', tier: 'local', leftDevice: true });
    const entries = await list();
    expect(entries[0]!.leftDevice).toBe(false);
  });

  test('list respects limit and skips corrupt lines', async () => {
    await append({ tool: 'a', summary: '1', tier: 'local' });
    await append({ tool: 'b', summary: '2', tier: 'local' });
    // corrupt the file directly
    fsStore['/mock-documents/vault-audit/audit.jsonl'] += 'NOT JSON{{{\n';
    await append({ tool: 'c', summary: '3', tier: 'local' });

    const limited = await list(2);
    expect(limited.map((e) => e.summary)).toEqual(['3', '2']);
    const all = await list();
    expect(all).toHaveLength(3);
  });

  test('clear wipes the log', async () => {
    await append({ tool: 'save_note', summary: 'x', tier: 'local' });
    await clear();
    expect(await list()).toHaveLength(0);
    // clear is idempotent
    await clear();
  });
});

// ── executor ──────────────────────────────────────────────────────────────
describe('ToolExecutor', () => {
  const audit = jest.fn(async () => {});

  function makeExecutor(tools: ToolDefinition[]): ToolExecutor {
    const registry = new Map<string, ToolDefinition>();
    for (const t of tools) registry.set(t.name, t);
    return new ToolExecutor(registry, audit);
  }

  const call = (tool: string, args: Record<string, unknown> = {}): ToolCall => ({
    tool: tool as ToolName,
    args,
  });

  test('unknown tool → ok:false, never throws', async () => {
    const ex = makeExecutor([]);
    const res = await ex.run(call('nope'), 'local');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Unknown tool/);
  });

  test('throwing tool is caught → ok:false with error message', async () => {
    const boom: ToolDefinition = {
      name: 'boom',
      description: 'throws',
      sideEffecting: false,
      execute: async () => {
        throw new Error('kaboom');
      },
    };
    const ex = makeExecutor([boom]);
    const res = await ex.run(call('boom'), 'local');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('kaboom');
    expect(res.tool).toBe('boom');
  });

  test('successful tool result passes through with tier in context', async () => {
    let seenTier: PrivacyTier | undefined;
    const okTool: ToolDefinition = {
      name: 'save_note',
      description: 'ok',
      sideEffecting: false,
      execute: async (args, ctx) => {
        seenTier = ctx.tier;
        await ctx.audit({ tool: 'save_note', summary: 'saved', tier: ctx.tier, leftDevice: false });
        return { ok: true, summary: 'saved', data: { noteId: String(args.id ?? '1') } };
      },
    };
    const ex = makeExecutor([okTool]);
    const res = await ex.run(call('save_note', { id: '42' }), 'local');
    expect(res.ok).toBe(true);
    expect(res.summary).toBe('saved');
    expect(res.data).toEqual({ noteId: '42' });
    expect(seenTier).toBe('local');
    expect(audit).toHaveBeenCalledTimes(1);
  });

  test('SIDE_EFFECTING covers exactly the two OS-mutating tools', () => {
    expect(SIDE_EFFECTING.has('create_reminder')).toBe(true);
    expect(SIDE_EFFECTING.has('create_event')).toBe(true);
    expect(SIDE_EFFECTING.has('save_note')).toBe(false);
    expect(SIDE_EFFECTING.has('recall_memory')).toBe(false);
    expect(SIDE_EFFECTING.size).toBe(2);
  });
});
