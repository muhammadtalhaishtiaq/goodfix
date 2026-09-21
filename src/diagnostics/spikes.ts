/**
 * src/diagnostics/spikes.ts — Phase-0 gate harness (PURE: no expo, no llama,
 * no react-native imports). Defines the 30 tool-calling spike cases and the
 * deterministic scorer the Diagnostics screen uses to compute the gate bars:
 *   toolRight ≥ 90% and argsRight ≥ 85%  →  PASS
 *
 * Reference date for relative utterances: Sunday 2026-09-20.
 */

/**
 * Fixed "now" for the tool-calling spike (Sunday 2026-09-20, 08:00 local).
 * Relative utterances ("tomorrow", "at 5pm today") are scored against this
 * reference so the gate is deterministic no matter when it runs.
 */
export const REFERENCE_NOW = new Date(2026, 8, 20, 8, 0, 0).getTime();

export interface SpikeCase {
  input: string;
  expectedTool: string;
  /**
   * Expected args. Keys are compared per-tool (see scoreToolCall).
   * `keyword` is harness-only (save_note): the predicted body must contain it.
   */
  expectedArgs: Record<string, unknown>;
}

export const TOOLCALL_CASES: SpikeCase[] = [
  // ---- create_reminder (8) ----
  { input: 'Remind me to buy milk tomorrow at 9am', expectedTool: 'create_reminder', expectedArgs: { title: 'buy milk', datetime_iso: '2026-09-21T09:00:00' } },
  { input: 'Set a reminder: call the bank on 2026-09-23 at 2pm', expectedTool: 'create_reminder', expectedArgs: { title: 'call the bank', datetime_iso: '2026-09-23T14:00:00' } },
  { input: "Don't forget to water the plants — remind me on 2026-09-22 at 8am", expectedTool: 'create_reminder', expectedArgs: { title: 'water the plants', datetime_iso: '2026-09-22T08:00:00' } },
  { input: 'Remind me at 5pm today to leave for the gym', expectedTool: 'create_reminder', expectedArgs: { title: 'leave for the gym', datetime_iso: '2026-09-20T17:00:00' } },
  { input: 'Ping me tomorrow at 7:30am to meditate', expectedTool: 'create_reminder', expectedArgs: { title: 'meditate', datetime_iso: '2026-09-21T07:30:00' } },
  { input: 'Reminder: pay the electricity bill on 2026-10-01 at 10am', expectedTool: 'create_reminder', expectedArgs: { title: 'pay the electricity bill', datetime_iso: '2026-10-01T10:00:00' } },
  { input: 'Remind me to take my vitamins tomorrow at 8am', expectedTool: 'create_reminder', expectedArgs: { title: 'take my vitamins', datetime_iso: '2026-09-21T08:00:00' } },
  { input: 'nudge me on 2026-09-24 at noon to submit the report', expectedTool: 'create_reminder', expectedArgs: { title: 'submit the report', datetime_iso: '2026-09-24T12:00:00' } },

  // ---- create_event (6) ----
  { input: 'Add a calendar event: team standup tomorrow at 10am for 30 minutes', expectedTool: 'create_event', expectedArgs: { title: 'team standup', datetime_iso: '2026-09-21T10:00:00', duration_min: 30 } },
  { input: 'Schedule a dentist appointment on 2026-10-05 at 3pm', expectedTool: 'create_event', expectedArgs: { title: 'dentist appointment', datetime_iso: '2026-10-05T15:00:00' } },
  { input: "Put 'Dinner with Sara' on my calendar Friday at 7pm", expectedTool: 'create_event', expectedArgs: { title: 'Dinner with Sara', datetime_iso: '2026-09-25T19:00:00' } },
  { input: 'Create an event for project deadline review on 2026-09-30 at 2pm, one hour', expectedTool: 'create_event', expectedArgs: { title: 'project deadline review', datetime_iso: '2026-09-30T14:00:00', duration_min: 60 } },
  { input: 'Block tomorrow 2pm to 3pm for focus time', expectedTool: 'create_event', expectedArgs: { title: 'focus time', datetime_iso: '2026-09-21T14:00:00', duration_min: 60 } },
  { input: 'Add birthday dinner with mom on 2026-10-12 at 6:30pm', expectedTool: 'create_event', expectedArgs: { title: 'birthday dinner with mom', datetime_iso: '2026-10-12T18:30:00' } },

  // ---- save_note (7) ----
  { input: 'Note this: the WiFi password is hunter2-5G', expectedTool: 'save_note', expectedArgs: { body: 'the WiFi password is hunter2-5G', keyword: 'hunter2' } },
  { input: 'Save a note: book recommendations — Project Hail Mary and Dark Matter', expectedTool: 'save_note', expectedArgs: { body: 'book recommendations — Project Hail Mary and Dark Matter', keyword: 'hail mary' } },
  { input: 'Remember that I prefer aisle seats on flights', expectedTool: 'save_note', expectedArgs: { body: 'I prefer aisle seats on flights', keyword: 'aisle' } },
  { input: 'Jot down: birthday gift idea for dad — a leather wallet', expectedTool: 'save_note', expectedArgs: { body: 'birthday gift idea for dad — a leather wallet', keyword: 'wallet' } },
  { input: 'Save this: my new deadlift PR is 100kg', expectedTool: 'save_note', expectedArgs: { body: 'my new deadlift PR is 100kg', keyword: 'deadlift' } },
  { input: "Note to self: the plumber's number is 555-0142", expectedTool: 'save_note', expectedArgs: { body: "the plumber's number is 555-0142", keyword: 'plumber' } },
  { input: 'Write down that I need to renew my passport before December', expectedTool: 'save_note', expectedArgs: { body: 'I need to renew my passport before December', keyword: 'passport' } },

  // ---- recall_memory (5) ----
  { input: 'What did I say about my gym PR?', expectedTool: 'recall_memory', expectedArgs: { query: 'my gym PR' } },
  { input: 'Do you remember the WiFi password?', expectedTool: 'recall_memory', expectedArgs: { query: 'WiFi password' } },
  { input: 'What were those book recommendations again?', expectedTool: 'recall_memory', expectedArgs: { query: 'book recommendations' } },
  { input: 'What did I note about my passport?', expectedTool: 'recall_memory', expectedArgs: { query: 'passport' } },
  { input: 'Remind me what I told you about flight seats', expectedTool: 'recall_memory', expectedArgs: { query: 'flight seats' } },

  // ---- none (4) ----
  { input: 'Hey, how are you doing today?', expectedTool: 'none', expectedArgs: {} },
  { input: "What's the weather like today?", expectedTool: 'none', expectedArgs: {} },
  { input: 'Tell me a joke about programmers', expectedTool: 'none', expectedArgs: {} },
  { input: "Thanks, that's all for now", expectedTool: 'none', expectedArgs: {} },
];

/** Normalize a title for case-insensitive comparison. */
function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titlesMatch(a: string, b: string): boolean {
  const x = normTitle(a);
  const y = normTitle(b);
  return x.length > 0 && y.length > 0 && (x === y || x.includes(y) || y.includes(x));
}

/** Extract the YYYY-MM-DD date part from an ISO-ish datetime string. */
function datePart(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export interface PredictedCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface SpikeScore {
  toolRight: boolean;
  argsRight: boolean;
}

/**
 * Score one predicted tool call against a spike case.
 * - toolRight: exact tool-name match.
 * - argsRight: every expected arg key matches —
 *   title (case-insensitive), datetime (date part), duration_min (numeric),
 *   save_note body (non-empty + contains the expected keyword),
 *   recall_memory query (non-empty), none (no args).
 */
export function scoreToolCall(predicted: PredictedCall, expected: SpikeCase): SpikeScore {
  const toolRight = predicted.tool === expected.expectedTool;
  if (!toolRight) return { toolRight: false, argsRight: false };

  const pArgs = predicted.args ?? {};
  const eArgs = expected.expectedArgs ?? {};

  if (expected.expectedTool === 'none') {
    return { toolRight: true, argsRight: Object.keys(pArgs).length === 0 };
  }

  let argsRight = true;
  for (const key of Object.keys(eArgs)) {
    if (key === 'keyword') continue; // harness-only helper, not a tool arg
    const ev = eArgs[key];
    const pv = pArgs[key];
    if (key === 'title') {
      argsRight = typeof pv === 'string' && typeof ev === 'string' && titlesMatch(pv, ev);
    } else if (key === 'datetime_iso' || key === 'datetime') {
      const a = datePart(pv);
      const b = datePart(ev);
      argsRight = a !== null && b !== null && a === b;
    } else if (key === 'duration_min') {
      argsRight = Number(pv) === Number(ev) && !Number.isNaN(Number(ev));
    } else if (key === 'body' && expected.expectedTool === 'save_note') {
      const kw = typeof eArgs['keyword'] === 'string' ? (eArgs['keyword'] as string) : '';
      argsRight =
        typeof pv === 'string' &&
        pv.trim().length > 0 &&
        (kw.length === 0 || pv.toLowerCase().includes(kw.toLowerCase()));
    } else if (key === 'query' && expected.expectedTool === 'recall_memory') {
      argsRight = typeof pv === 'string' && pv.trim().length > 0;
    } else {
      argsRight = String(pv) === String(ev);
    }
    if (!argsRight) break;
  }
  return { toolRight: true, argsRight };
}
