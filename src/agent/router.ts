import { buildRouterPrompt } from './prompts';
import { validateToolCall } from './validator';
import type { InferenceEngine } from '../inference/types';
import type { RouterDecision, ToolCall, ToolName } from './types';

/**
 * Routes a user message to a tool call.
 *
 * Primary path: the on-device model, forced to emit one JSON object
 * {tool, args}, which is then validated. ANY failure (no engine, bad JSON,
 * failed validation, thrown error) drops to the deterministic fallback:
 * keyword/regex routing with a small pragmatic relative-date parser.
 */

const ROUTER_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    tool: {
      type: 'string',
      enum: [
        'create_reminder',
        'create_event',
        'save_note',
        'recall_memory',
        'none',
      ],
    },
    args: { type: 'object' },
  },
  required: ['tool', 'args'],
  additionalProperties: false,
};

/** Extract the first {...} JSON object from possibly-noisy model output. */
function extractJsonObject(text: string): { tool?: unknown; args?: unknown } | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as { tool?: unknown; args?: unknown };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pragmatic relative-date parser (deterministic fallback).
// Returns epoch ms, always in the future, or null when nothing parses.
// ---------------------------------------------------------------------------

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

/** Time-of-day found in text, e.g. "at 5pm", "noon", "tonight". */
function parseTimeOfDay(t: string): { h: number; min: number } | null {
  let m: RegExpMatchArray | null;

  // Explicit am/pm: "5pm", "5:30 pm"
  m = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(t);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (m[3] === 'pm' && h < 12) h += 12;
    if (m[3] === 'am' && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return { h, min };
  }

  // Bare hour with "at": "at 5" / "at 17:30" — bare 1-11 assumed PM.
  m = /\bat\s+(\d{1,2})(?::(\d{2}))?\b/.exec(t);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 1 && h <= 11) h += 12;
    if (h > 23 || min > 59) return null;
    return { h: h % 24, min };
  }

  if (/\bnoon\b/.test(t)) return { h: 12, min: 0 };
  if (/\bmidnight\b/.test(t)) return { h: 0, min: 0 };
  if (/\bmorning\b/.test(t)) return { h: 9, min: 0 };
  if (/\bafternoon\b/.test(t)) return { h: 14, min: 0 };
  if (/\bevening\b/.test(t) || /\btonight\b/.test(t)) return { h: 20, min: 0 };
  return null;
}

export function parseRelativeDate(
  text: string,
  nowMs: number = Date.now(),
): number | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  const now = new Date(nowMs);

  // "in 2 hours" / "in 30 minutes" / "in 3 days" / "in 1 week"
  const inMatch = /\bin\s+(\d+)\s*(minutes?|hours?|days?|weeks?)\b/.exec(t);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const mult = unit.startsWith('minute')
      ? 60_000
      : unit.startsWith('hour')
        ? 3_600_000
        : unit.startsWith('day')
          ? 86_400_000
          : 604_800_000;
    return nowMs + n * mult;
  }

  // Find a base DAY, if any date word is present.
  let baseDay: Date | null = null;
  let defaultH = 9;
  const defaultM = 0;

  // Explicit ISO date: "2026-09-23"
  const isoD = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(t);
  if (isoD) {
    baseDay = new Date(Number(isoD[1]), Number(isoD[2]) - 1, Number(isoD[3]));
  } else {
    const wd = /\b(?:(next|this|on)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.exec(t);
  if (wd) {
    const target = WEEKDAYS.indexOf(wd[2]);
    let delta = (target - now.getDay() + 7) % 7;
    if (delta === 0) delta = 7; // bare weekday today -> next week
    if (wd[1] === 'next') delta += 7;
    baseDay = new Date(now);
    baseDay.setDate(baseDay.getDate() + delta);
  } else {
    const md = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/.exec(t);
    if (md) {
      const month = MONTHS.indexOf(md[1]);
      const day = parseInt(md[2], 10);
      baseDay = new Date(now.getFullYear(), month, day);
      if (baseDay.getTime() < nowMs - 86_400_000) {
        baseDay = new Date(now.getFullYear() + 1, month, day);
      }
    } else if (/\btomorrow\b/.test(t)) {
      baseDay = new Date(now);
      baseDay.setDate(baseDay.getDate() + 1);
    } else if (/\btonight\b/.test(t)) {
      baseDay = new Date(now);
      defaultH = 20;
    } else if (/\btoday\b/.test(t)) {
      baseDay = new Date(now);
      defaultH = 18;
    }
  }
  }

  const tod = parseTimeOfDay(t);
  if (baseDay) {
    const h = tod ? tod.h : defaultH;
    const min = tod ? tod.min : defaultM;
    baseDay.setHours(h, min, 0, 0);
    let ms = baseDay.getTime();
    if (ms <= nowMs) ms += 86_400_000; // time already passed -> next day
    return ms;
  }
  if (tod) {
    const d = new Date(now);
    d.setHours(tod.h, tod.min, 0, 0);
    let ms = d.getTime();
    if (ms <= nowMs) ms += 86_400_000;
    return ms;
  }
  return null;
}

/** Tomorrow 09:00 local — default when a reminder has no usable time. */
function defaultReminderMs(nowMs: number = Date.now()): number {
  const d = new Date(nowMs);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

function cleanTitle(s: string): string {
  return s
    .replace(/^(?:please\s+)?(?:to|about|of|for|a|an|the)\s+/i, '')
    .replace(/^['"“”‘’]+|['"“”‘’]+$/g, '')
    .replace(/\s+(in\s+the|in|at|on|for|the)$/i, '')
    .replace(/[.\s!?,;:'"-]+$/, '')
    .trim();
}

/** First date-trigger word anywhere in the text. */
const DATE_TRIGGERS =
  /\b(at|on|in|tomorrow|today|tonight|noon|midnight|this|next|morning|afternoon|evening)\b/i;

/** Leading core of a date phrase (used to recover a title that follows it). */
const WHEN_CORE =
  /^(?:on|at|in)\s+(?:\d{4}-\d{2}-\d{2}|[a-z]+)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\s+(?:noon|midnight|morning|afternoon|evening))?|^(?:tomorrow|today|tonight)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?|^(?:next|this)\s+[a-z]+/i;

/**
 * Split "call mom at 5pm" into title "call mom" + time phrase "at 5pm".
 * The time phrase is the leftmost date-like expression; parseRelativeDate is
 * tolerant of trailing words ("tomorrow at 10am for 30 minutes" still parses).
 * Handles time-first phrasing too ("tomorrow 2pm to 3pm for focus time").
 */
function splitDate(
  rest: string,
  nowMs: number,
): { text: string; when: string | null } {
  const re = new RegExp(DATE_TRIGGERS.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    const when = rest.slice(m.index).trim();
    if (parseRelativeDate(when, nowMs) !== null) {
      let title = rest.slice(0, m.index).trim();
      if (!title) {
        // Time phrase first; the title follows it.
        title = when.replace(WHEN_CORE, '').trim();
        // "tomorrow 2pm to 3pm for focus time" -> trailing segment after "for".
        const fm = /.*\bfor\s+(.+)$/i.exec(title);
        if (fm) title = fm[1].trim();
      }
      return { text: title, when };
    }
  }
  return { text: rest.trim(), when: null };
}

/** "at 5pm today to leave for the gym" — time first, title last. */
function splitLeadingTime(rest: string): { text: string; when: string } | null {
  const m =
    /^(tomorrow|today|tonight)(\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\s+(?:to\s+)?(.+)$/i.exec(
      rest,
    );
  if (m) return { when: `${m[1]}${m[2] ?? ''}`.trim(), text: m[3].trim() };
  const m2 =
    /^(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s+(?:today|tomorrow|tonight))?)\s+(?:to\s+)?(.+)$/i.exec(
      rest,
    );
  if (m2) return { when: m2[1].trim(), text: m2[2].trim() };
  return null;
}

/** Wall-clock ISO ("2026-09-20T17:00:00") — no UTC shift, so a 5pm
 * reminder keeps the date the user said it on, in every timezone. */
function localIso(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

function reminderCall(
  rawTitle: string,
  when: string | null,
  nowMs: number,
): ToolCall {
  const title = cleanTitle(rawTitle) || 'Reminder';
  const ms = when ? parseRelativeDate(when, nowMs) : null;
  const iso = localIso(ms !== null && ms > nowMs ? ms : defaultReminderMs(nowMs));
  return { tool: 'create_reminder', args: { title, datetime_iso: iso } };
}

function eventCall(
  rawTitle: string,
  when: string | null,
  durationMin: number | undefined,
  nowMs: number,
): ToolCall {
  const title = cleanTitle(rawTitle) || 'Event';
  const ms = when ? parseRelativeDate(when, nowMs) : null;
  const iso = localIso(ms !== null && ms > nowMs ? ms : defaultReminderMs(nowMs));
  const args: Record<string, unknown> = { title, datetime_iso: iso };
  if (durationMin !== undefined) args.duration_min = durationMin;
  return { tool: 'create_event', args };
}

/** "for 30 minutes" / "one hour" / "2 hours" -> minutes. */
function parseDurationMin(text: string): number | null {
  const t = text.toLowerCase();
  let m = /\bfor\s+(\d+)\s*(?:minutes?|mins?)\b/.exec(t);
  if (m) return parseInt(m[1], 10);
  m = /\b(\d+)\s*(?:hours?|hrs?)\b/.exec(t);
  if (m) return parseInt(m[1], 10) * 60;
  if (/\bone\s+hour\b/.test(t)) return 60;
  if (/\bhalf\s+(?:an\s+)?hour\b/.test(t)) return 30;
  return null;
}

function toMinutes(hhmm: string): number | null {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(hhmm);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "2pm to 3pm" -> 60 (minutes between). */
function parseTimeRange(text: string): number | null {
  const m =
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:to|-|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i.exec(
      text,
    );
  if (!m) return null;
  const a = toMinutes(m[1]);
  const b = toMinutes(m[2]);
  if (a === null || b === null || b <= a) return null;
  return b - a;
}

/** "water the plants" from "don't forget to water the plants". */
function stripForgetPrefix(s: string): string {
  return s
    .replace(/^(?:please\s+)?(?:don't\s+forget|do\s+not\s+forget)\s+(?:to\s+)?/i, '')
    .trim();
}

/**
 * Deterministic keyword/regex routing. Used when there is no engine or the
 * model path fails. Always returns a VALIDATED-shape call (validator-compatible).
 */
export function fallbackRoute(input: string, nowMs: number = Date.now()): ToolCall {
  const s = input.trim();
  let m: RegExpMatchArray | null;

  // 1. Recall — questions about stored memory. Checked FIRST so that
  //    "Remind me what I told you about flight seats" resolves to recall.
  if (
    /what\s+did\s+i\s+(?:say|note|tell|mention)|what\s+were\s+those|what\s+was\s+(?:that|the)|what\s+do\s+you\s+remember|do\s+you\s+remember|remember\s+when|\brecall\b|what\s+i\s+(?:said|noted|told\s+you)|tell\s+me\s+about/i.test(
      s,
    )
  ) {
    const q = s
      .replace(/\?/g, ' ')
      .replace(/^(?:please\s+)?(?:remind\s+me\s+|can\s+you\s+)?/i, '')
      .replace(
        /^(?:what\s+did\s+i\s+(?:say|note|tell|mention)(?:\s+about)?|what\s+were\s+those|what\s+was\s+(?:that|the)|what\s+do\s+you\s+remember|do\s+you\s+remember|remember\s+when|recall|what\s+i\s+(?:said|noted|told\s+you)(?:\s+about)?|tell\s+me\s+about)\s*/i,
        '',
      )
      .replace(/^(?:about|the)\s+/i, '')
      .replace(/\s+again\s*$/i, '')
      .trim();
    return { tool: 'recall_memory', args: { query: q || s } };
  }

  // 2. Explicit reminder — "remind me to ...", "ping me ...", "nudge me ...",
  //    "remember to ...", "don't forget to ...", "set a reminder: ...",
  //    "Reminder: ..."
  m =
    /^(?:please\s+)?(?:remind\s+me|ping\s+me|nudge\s+me|remember\s+to|set\s+(?:a\s+)?reminders?|add\s+(?:a\s+)?reminders?)\b\s*(?:to\b|:)?\s*(.+)?$/i.exec(
      s,
    );
  if (m && m[1] && m[1].trim()) {
    const rest = m[1].trim();
    const lead = splitLeadingTime(rest);
    if (lead) return reminderCall(lead.text, lead.when, nowMs);
    const { text, when } = splitDate(rest, nowMs);
    return reminderCall(text, when, nowMs);
  }
  m = /^(?:reminder|reminders?)\s*:\s*(.+)$/i.exec(s);
  if (m) {
    const { text, when } = splitDate(m[1].trim(), nowMs);
    return reminderCall(text, when, nowMs);
  }
  m = /^(.+?)[\s,;—–-]+\s*remind\s+me\s+(.+)$/i.exec(s);
  if (m) {
    const { text, when } = splitDate(m[2].trim(), nowMs);
    return reminderCall(stripForgetPrefix(m[1]) || text, when, nowMs);
  }

  // 3. Save note — "note this: ...", "save a note: ...", "jot down: ...",
  //    "save this: ...", "remember that ...", "note to self: ...",
  //    "write down ..."
  m =
    /^(?:please\s+)?(?:note\s+this|save\s+(?:a\s+note|this)|jot\s+down|write\s+down|note\s+to\s+self|remember\s+that)(?:\s+that)?\s*[:：]?\s*(.+)$/i.exec(
      s,
    );
  if (m && m[1].trim()) {
    return { tool: 'save_note', args: { body: m[1].trim() } };
  }

  // 4. Calendar event.
  m = /^put\s+(.+?)\s+on\s+my\s+calendar\s+(.+)$/i.exec(s);
  if (m) {
    const whenMs = parseRelativeDate(m[2].trim(), nowMs);
    const iso = localIso(
      whenMs !== null && whenMs > nowMs ? whenMs : defaultReminderMs(nowMs),
    );
    return {
      tool: 'create_event',
      args: {
        title: cleanTitle(m[1]) || 'Event',
        datetime_iso: iso,
        duration_min: 60,
      },
    };
  }
  m = /^create\s+(?:an?\s+)?events?\s+for\s+(.+)$/i.exec(s);
  if (m) {
    const rest = m[1].trim();
    const { text, when } = splitDate(rest, nowMs);
    return eventCall(text, when, parseDurationMin(rest) ?? 60, nowMs);
  }
  m = /^block\s+(.+)$/i.exec(s);
  if (m) {
    const rest = m[1].trim();
    const dur = parseTimeRange(rest) ?? parseDurationMin(rest) ?? 60;
    const whenStr = rest
      .replace(/\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?.*$/i, '')
      .trim();
    const { text, when } = splitDate(whenStr, nowMs);
    const fm = /.*\bfor\s+(.+)$/i.exec(rest);
    const title = text || (fm ? fm[1] : rest);
    return eventCall(title, when, dur, nowMs);
  }
  m =
    /^(?:please\s+)?(?:schedule|set\s+up|book)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i.exec(
      s,
    );
  if (m) {
    const rest = m[1].trim();
    const { text, when } = splitDate(rest, nowMs);
    return eventCall(text, when, parseDurationMin(rest) ?? 60, nowMs);
  }
  m = /^add\s+(?:a\s+|an\s+|the\s+)?(?:calendar\s+events?\s*:?\s*)?(.+)$/i.exec(s);
  if (m) {
    const rest = m[1].trim();
    const { text, when } = splitDate(rest, nowMs);
    if (when) {
      return eventCall(text, when, parseDurationMin(rest) ?? 60, nowMs);
    }
    // "add X" with no date — not a calendar action.
    return { tool: 'none', args: {} };
  }
  if (/\b(calendar|appointment|meeting)\b/i.test(s)) {
    const stripped = s.replace(
      /^(?:please\s+)?(?:schedule|add|create|set\s+up|book)\s+(?:a\s+|an\s+|the\s+)?/i,
      '',
    );
    const { text, when } = splitDate(cleanTitle(stripped), nowMs);
    return eventCall(text || stripped, when, parseDurationMin(s) ?? 60, nowMs);
  }

  // 5. Nothing matched — pure conversation.
  return { tool: 'none', args: {} };
}

export class Router {
  constructor(private readonly engine: InferenceEngine | null) {}

  async route(input: string, nowMs: number = Date.now()): Promise<RouterDecision> {
    if (this.engine) {
      try {
        const prompt =
          `${buildRouterPrompt()}\n\nUser message: ${JSON.stringify(input)}\nOutput:`;
        const raw = await this.engine.complete(prompt, {
          jsonSchema: ROUTER_OUTPUT_SCHEMA,
          maxTokens: 256,
          temperature: 0,
        });
        const parsed = extractJsonObject(raw);
        if (parsed) {
          const v = validateToolCall(parsed.tool, parsed.args);
          if (v.ok && v.args) {
            return {
              call: { tool: parsed.tool as ToolName, args: v.args },
              source: 'model',
            };
          }
        }
      } catch {
        // Any model failure -> deterministic fallback below.
      }
    }
    return { call: fallbackRoute(input, nowMs), source: 'deterministic-fallback' };
  }
}
