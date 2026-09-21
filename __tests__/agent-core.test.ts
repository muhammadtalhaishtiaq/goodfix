import { validateToolCall } from '../src/agent/validator';
import { TOOL_SCHEMAS } from '../src/agent/toolSchemas';
import { buildRouterPrompt, buildChatPrompt } from '../src/agent/prompts';
import { Router, fallbackRoute, parseRelativeDate } from '../src/agent/router';
import { Orchestrator } from '../src/agent/orchestrator';
import type { AuditEntry } from '../src/agent/orchestrator';
import type { InferenceEngine } from '../src/inference/types';
import type { MemoryStore, MemoryNote, RecallHit } from '../src/memory/types';
import type { ToolDefinition } from '../src/tools/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function makeEngine(
  completeImpl: (prompt: string) => Promise<string> | string,
): InferenceEngine {
  return {
    name: 'mock-engine',
    load: async () => {},
    unload: async () => {},
    status: () => ({ loaded: true }),
    complete: async (prompt: string) => completeImpl(prompt),
    embed: async () => ({ vector: [], dims: 0 }),
    supportsEmbeddings: false,
  };
}

function makeMemory(): MemoryStore & { notes: MemoryNote[] } {
  const notes: MemoryNote[] = [];
  let n = 0;
  const store: MemoryStore = {
    init: async () => {},
    save: async (body: string, kind = 'note') => {
      n += 1;
      const note: MemoryNote = {
        id: `m${n}`,
        body,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        kind,
        filePath: `m${n}.md`,
      };
      notes.push(note);
      return note;
    },
    update: async (id: string, body: string) => {
      const f = notes.find((x) => x.id === id);
      if (!f) throw new Error('not found');
      f.body = body;
      f.updatedAt = Date.now();
      return f;
    },
    remove: async (id: string) => {
      const i = notes.findIndex((x) => x.id === id);
      if (i >= 0) notes.splice(i, 1);
    },
    get: async (id: string) => notes.find((x) => x.id === id) ?? null,
    list: async (limit = 50, offset = 0) =>
      [...notes].reverse().slice(offset, offset + limit),
    recall: async (query: string, limit = 5) => {
      const words = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      const hits: RecallHit[] = notes
        .filter((note) =>
          words.some((w) => note.body.toLowerCase().includes(w)),
        )
        .map((note) => ({ note, score: 1, method: 'fts' as const }));
      return hits.slice(0, limit);
    },
    count: async () => notes.length,
  };
  return Object.assign(store, { notes });
}

function makeTools() {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const mk = (name: string, sideEffecting: boolean): ToolDefinition => ({
    name,
    description: `${name} tool`,
    sideEffecting,
    execute: async (args) => {
      calls.push({ name, args });
      return { ok: true, summary: `${name} executed` };
    },
  });
  const tools = new Map<string, ToolDefinition>([
    ['create_reminder', mk('create_reminder', true)],
    ['create_event', mk('create_event', true)],
  ]);
  return { tools, calls };
}

function makeOrchestrator(engine: InferenceEngine | null) {
  const memory = makeMemory();
  const { tools, calls } = makeTools();
  const audits: AuditEntry[] = [];
  const orch = new Orchestrator({
    engine,
    memory,
    tools,
    audit: async (e) => {
      audits.push(e);
    },
  });
  return { orch, memory, tools, calls, audits };
}

const futureIso = (msAhead: number) =>
  new Date(Date.now() + msAhead).toISOString();

// ---------------------------------------------------------------------------
// validator
// ---------------------------------------------------------------------------

describe('validator', () => {
  test('accepts a good create_reminder and strips unknown fields', () => {
    const v = validateToolCall('create_reminder', {
      title: 'Call mom',
      datetime_iso: futureIso(3_600_000),
      hacker: 'nope',
    });
    expect(v.ok).toBe(true);
    expect(v.errors).toEqual([]);
    expect(v.args).toEqual({
      title: 'Call mom',
      datetime_iso: expect.any(String),
    });
  });

  test('accepts create_event with and without duration_min', () => {
    const withDur = validateToolCall('create_event', {
      title: 'Dentist',
      datetime_iso: futureIso(86_400_000),
      duration_min: 45,
    });
    expect(withDur.ok).toBe(true);
    expect(withDur.args?.duration_min).toBe(45);

    const withoutDur = validateToolCall('create_event', {
      title: 'Dentist',
      datetime_iso: futureIso(86_400_000),
    });
    expect(withoutDur.ok).toBe(true);
    expect(withoutDur.args).not.toHaveProperty('duration_min');
  });

  test('coerces a numeric-string duration_min', () => {
    const v = validateToolCall('create_event', {
      title: 'Dentist',
      datetime_iso: futureIso(86_400_000),
      duration_min: '30',
    });
    expect(v.ok).toBe(true);
    expect(v.args?.duration_min).toBe(30);
  });

  test('rejects a past datetime_iso', () => {
    const v = validateToolCall('create_reminder', {
      title: 'Late',
      datetime_iso: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/future/);
  });

  test('rejects a malformed datetime_iso', () => {
    const v = validateToolCall('create_event', {
      title: 'X',
      datetime_iso: 'not-a-date',
    });
    expect(v.ok).toBe(false);
  });

  test('rejects missing title and non-object args', () => {
    expect(validateToolCall('create_reminder', { datetime_iso: futureIso(1000) }).ok).toBe(false);
    expect(validateToolCall('create_reminder', 'nope').ok).toBe(false);
    expect(validateToolCall('create_reminder', { title: '   ', datetime_iso: futureIso(1000) }).ok).toBe(false);
  });

  test('rejects bad duration_min values', () => {
    for (const bad of [0, -5, 1.5, 'abc']) {
      const v = validateToolCall('create_event', {
        title: 'X',
        datetime_iso: futureIso(1000),
        duration_min: bad,
      });
      expect(v.ok).toBe(false);
    }
  });

  test('save_note: accepts, rejects empty body and >5000 chars', () => {
    expect(validateToolCall('save_note', { body: 'hello' }).ok).toBe(true);
    expect(validateToolCall('save_note', { body: '   ' }).ok).toBe(false);
    expect(validateToolCall('save_note', { body: 'x'.repeat(5001) }).ok).toBe(false);
    expect(validateToolCall('save_note', { body: 'x'.repeat(5000) }).ok).toBe(true);
  });

  test('recall_memory: accepts, rejects empty query', () => {
    expect(validateToolCall('recall_memory', { query: 'coffee' }).ok).toBe(true);
    expect(validateToolCall('recall_memory', { query: '' }).ok).toBe(false);
  });

  test('none: always ok, strips everything', () => {
    const v = validateToolCall('none', { junk: 1 });
    expect(v.ok).toBe(true);
    expect(v.args).toEqual({});
  });

  test('rejects an unknown tool', () => {
    const v = validateToolCall('delete_everything', {});
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toMatch(/unknown tool/);
  });
});

// ---------------------------------------------------------------------------
// schemas + prompts
// ---------------------------------------------------------------------------

describe('toolSchemas', () => {
  test('covers all five tools with required fields', () => {
    const names = Object.keys(TOOL_SCHEMAS).sort();
    expect(names).toEqual([
      'create_event',
      'create_reminder',
      'none',
      'recall_memory',
      'save_note',
    ]);
    const reminder = TOOL_SCHEMAS.create_reminder as { required: string[] };
    expect(reminder.required).toEqual(
      expect.arrayContaining(['title', 'datetime_iso']),
    );
  });
});

describe('prompts', () => {
  test('router prompt lists every tool and demands single JSON output', () => {
    const p = buildRouterPrompt(new Date('2026-09-20T12:00:00Z'));
    for (const name of [
      'create_reminder',
      'create_event',
      'save_note',
      'recall_memory',
      'none',
    ]) {
      expect(p).toContain(name);
    }
    expect(p).toContain('ONE JSON object');
    expect(p).toContain('2026-09-20');
  });

  test('chat prompt embeds the memory context', () => {
    const p = buildChatPrompt('user likes dark roast');
    expect(p).toContain('user likes dark roast');
    expect(p).toContain('ONLY');
  });
});

// ---------------------------------------------------------------------------
// relative-date parser
// ---------------------------------------------------------------------------

describe('parseRelativeDate', () => {
  const now = Date.now();
  test('"in 2 hours" lands ~2h ahead', () => {
    const ms = parseRelativeDate('in 2 hours', now);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(now + 60 * 60 * 1000);
    expect(ms!).toBeLessThan(now + 3 * 60 * 60 * 1000);
  });
  test('"tomorrow" is in the future', () => {
    const ms = parseRelativeDate('tomorrow', now);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(now);
  });
  test('"at 5pm" is in the future', () => {
    const ms = parseRelativeDate('at 5pm', now);
    expect(ms).not.toBeNull();
    expect(ms!).toBeGreaterThan(now);
  });
  test('garbage returns null', () => {
    expect(parseRelativeDate('blorptastic', now)).toBeNull();
    expect(parseRelativeDate('', now)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// router: deterministic fallback (no engine)
// ---------------------------------------------------------------------------

describe('router deterministic fallback', () => {
  const route = (input: string) => {
    const r = new Router(null);
    return r.route(input);
  };

  test('routes 8 example utterances without any engine', async () => {
    const d1 = await route('remind me to call mom tomorrow');
    expect(d1.source).toBe('deterministic-fallback');
    expect(d1.call.tool).toBe('create_reminder');
    expect(d1.call.args.title as string).toMatch(/mom/i);
    expect(Date.parse(d1.call.args.datetime_iso as string)).toBeGreaterThan(Date.now());

    const d2 = await route('remind me to drink water in 2 hours');
    expect(d2.call.tool).toBe('create_reminder');
    const dt2 = Date.parse(d2.call.args.datetime_iso as string);
    expect(dt2).toBeGreaterThan(Date.now() + 60 * 60 * 1000);
    expect(dt2).toBeLessThan(Date.now() + 3 * 60 * 60 * 1000);

    const d3 = await route('remember that I like dark roast coffee');
    expect(d3.call.tool).toBe('save_note');
    expect(d3.call.args.body as string).toMatch(/dark roast/i);

    const d4 = await route('what did I say about the dentist?');
    expect(d4.call.tool).toBe('recall_memory');
    expect(d4.call.args.query as string).toMatch(/dentist/i);

    const d5 = await route('schedule a meeting with Sara next Monday');
    expect(d5.call.tool).toBe('create_event');
    expect(Date.parse(d5.call.args.datetime_iso as string)).toBeGreaterThan(Date.now());

    const d6 = await route('hello there');
    expect(d6.call.tool).toBe('none');

    const d7 = await route('remind me to buy milk');
    expect(d7.call.tool).toBe('create_reminder');
    expect(Date.parse(d7.call.args.datetime_iso as string)).toBeGreaterThan(Date.now());

    const d8 = await route('remind me what I said about yoga');
    expect(d8.call.tool).toBe('recall_memory');
  });

  test('fallbackRoute never emits unvalidated shapes', () => {
    for (const input of [
      'remind me to x tomorrow',
      'note this down please',
      'do you remember my birthday',
      'add a meeting friday at 3pm',
      '???',
    ]) {
      const call = fallbackRoute(input);
      const v = validateToolCall(call.tool, call.args);
      expect(v.ok).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// router: model path
// ---------------------------------------------------------------------------

describe('router model path', () => {
  test('uses the model when it returns valid JSON', async () => {
    const engine = makeEngine(
      async () =>
        '{"tool": "save_note", "args": {"body": "buy oat milk"}}',
    );
    const d = await new Router(engine).route('whatever');
    expect(d.source).toBe('model');
    expect(d.call.tool).toBe('save_note');
    expect(d.call.args).toEqual({ body: 'buy oat milk' });
  });

  test('falls back when the model returns garbage', async () => {
    const engine = makeEngine(async () => 'I am a potato, not JSON');
    const d = await new Router(engine).route('remember that the sky is blue');
    expect(d.source).toBe('deterministic-fallback');
    expect(d.call.tool).toBe('save_note');
  });

  test('falls back when model JSON fails validation (past date)', async () => {
    const engine = makeEngine(
      async () =>
        '{"tool": "create_reminder", "args": {"title": "x", "datetime_iso": "2020-01-01T00:00:00Z"}}',
    );
    const d = await new Router(engine).route('remind me yesterday');
    expect(d.source).toBe('deterministic-fallback');
    expect(d.call.tool).toBe('create_reminder');
    expect(Date.parse(d.call.args.datetime_iso as string)).toBeGreaterThan(Date.now());
  });

  test('falls back when the engine throws', async () => {
    const engine = makeEngine(async () => {
      throw new Error('model exploded');
    });
    const d = await new Router(engine).route('hello');
    expect(d.source).toBe('deterministic-fallback');
    expect(d.call.tool).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// orchestrator
// ---------------------------------------------------------------------------

describe('orchestrator', () => {
  test('save_note executes immediately, no confirm needed', async () => {
    const { orch, memory, audits } = makeOrchestrator(null);
    const turn = await orch.turn('remember that I prefer tea over coffee');
    expect(turn.confirmRequired).toBe(false);
    expect(turn.toolCall?.tool).toBe('save_note');
    expect(turn.result?.ok).toBe(true);
    expect(turn.reply.length).toBeGreaterThan(0);
    expect(turn.tier).toBe('local');
    expect(await memory.count()).toBe(1);
    expect(audits.some((a) => a.event === 'executed' && a.tool === 'save_note')).toBe(true);
    expect(audits.every((a) => a.tier === 'local' && a.leftDevice === false)).toBe(true);
  });

  test('create_reminder asks first; executes only after approve', async () => {
    const { orch, calls } = makeOrchestrator(null);
    const turn = await orch.turn('remind me to stretch in 3 hours');
    expect(turn.toolCall?.tool).toBe('create_reminder');
    expect(turn.confirmRequired).toBe(true);
    expect(turn.result).toBeNull();
    expect(turn.reply).toMatch(/Create reminder/i);
    expect(calls.length).toBe(0); // NOT executed before confirm

    const done = await orch.confirm(turn.id, true);
    expect(done.confirmed).toBe(true);
    expect(done.result?.ok).toBe(true);
    expect(calls.length).toBe(1);
    expect(calls[0].name).toBe('create_reminder');
    expect(calls[0].args.title as string).toMatch(/stretch/i);
  });

  test('create_reminder rejected -> tool never executes', async () => {
    const { orch, calls, audits } = makeOrchestrator(null);
    const turn = await orch.turn('remind me to call mom tomorrow');
    expect(turn.confirmRequired).toBe(true);

    const done = await orch.confirm(turn.id, false);
    expect(done.confirmed).toBe(false);
    expect(done.reply).toMatch(/won't do that/i);
    expect(calls.length).toBe(0);
    expect(audits.some((a) => a.event === 'rejected')).toBe(true);
  });

  test('recall_memory returns hits in the reply', async () => {
    const { orch, memory } = makeOrchestrator(null);
    await memory.save('I like dark roast coffee from the corner shop', 'note');
    const turn = await orch.turn('what did I say about coffee?');
    expect(turn.toolCall?.tool).toBe('recall_memory');
    expect(turn.confirmRequired).toBe(false);
    expect(turn.result?.ok).toBe(true);
    expect(turn.reply).toMatch(/dark roast/i);
  });

  test('recall_memory with no hits says so honestly', async () => {
    const { orch } = makeOrchestrator(null);
    const turn = await orch.turn('what did I say about submarines?');
    expect(turn.reply).toMatch(/couldn't find anything/i);
  });

  test('none -> conversational fallback reply, no crash', async () => {
    const { orch } = makeOrchestrator(null);
    const turn = await orch.turn('hello there');
    expect(turn.toolCall?.tool).toBe('none');
    expect(turn.reply).toMatch(/didn't quite catch/i);
  });

  test('model returning invalid args is rescued by the deterministic fallback', async () => {
    const engine = makeEngine(
      async () =>
        '{"tool": "create_reminder", "args": {"title": "x", "datetime_iso": "2020-01-01T00:00:00Z"}}',
    );
    const { orch, calls } = makeOrchestrator(engine);
    const turn = await orch.turn('remind me to stretch');
    // past-date JSON fails validation -> fallback routes a valid reminder instead
    expect(turn.toolCall?.tool).toBe('create_reminder');
    expect(turn.confirmRequired).toBe(true);
    expect(calls.length).toBe(0); // still not executed before confirm
  });

  test('model returning an unknown tool is rescued by the fallback', async () => {
    const evil = makeEngine(async () => '{"tool": "nuke", "args": {}}');
    const { orch } = makeOrchestrator(evil);
    const turn = await orch.turn('nonsense that matches nothing at all xyzzy');
    expect(turn.toolCall?.tool).toBe('none');
    expect(turn.result?.ok).toBe(true);
  });

  test('validation failure surfaces when routing cannot be rescued', async () => {
    // Direct unit check of the orchestrator error shape via unknown turn id.
    const { orch } = makeOrchestrator(null);
    const done = await orch.confirm('turn_does_not_exist', true);
    expect(done.result?.ok).toBe(false);
    expect(done.reply).toMatch(/nothing waiting/i);
  });

  test('every turn records audit entries with tier local', async () => {
    const { orch, audits } = makeOrchestrator(null);
    await orch.turn('remember that testing is good');
    await orch.turn('what did I say about testing?');
    const events = audits.map((a) => a.event);
    expect(events).toContain('turn');
    expect(events).toContain('routed');
    expect(events).toContain('validated');
    expect(events).toContain('executed');
    expect(audits.every((a) => a.tier === 'local')).toBe(true);
    expect(audits.every((a) => a.leftDevice === false)).toBe(true);
  });

  test('confirm executes create_event with validated args', async () => {
    const { orch, calls } = makeOrchestrator(null);
    const turn = await orch.turn('schedule a dentist appointment tomorrow at 2pm');
    expect(turn.toolCall?.tool).toBe('create_event');
    expect(turn.confirmRequired).toBe(true);
    const done = await orch.confirm(turn.id, true);
    expect(done.result?.ok).toBe(true);
    expect(calls.length).toBe(1);
    expect(calls[0].args.duration_min).toBe(60);
  });
});
