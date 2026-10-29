import { TOOL_SCHEMAS } from './toolSchemas';
import type { ToolName } from './types';

const TOOL_ORDER: ToolName[] = [
  'create_reminder',
  'create_event',
  'save_note',
  'recall_memory',
  'none',
];

const TOOL_WHEN: Record<ToolName, string> = {
  create_reminder:
    'the user wants to be reminded of something later ("remind me", "don\'t forget", "nudge me")',
  create_event:
    'the user wants to put a meeting/appointment on the calendar ("schedule", "book", "add to my calendar")',
  save_note:
    'the user wants to store information for later ("remember that", "note this", "jot down")',
  recall_memory:
    'the user asks what you or they remember ("what did I say", "do you remember", "recall")',
  none: 'greetings, chit-chat, questions answerable without tools, or anything unclear',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local ISO 8601 with numeric timezone offset, e.g. 2026-09-20T20:55:00-04:00. */
function localIso(d: Date): string {
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/**
 * System prompt for the on-device router model. Lists the 5 tools with their
 * schemas and forces a single JSON object {tool, args} as the entire output.
 */
export function buildRouterPrompt(now: Date = new Date()): string {
  const tools = TOOL_ORDER.map(
    (name, i) =>
      `${i + 1}. ${name} — use when ${TOOL_WHEN[name]}.\n` +
      `   Args schema: ${JSON.stringify(TOOL_SCHEMAS[name])}`,
  ).join('\n');

  return (
    `You are Vault's on-device tool router. Everything runs locally on the user's phone; nothing leaves the device.\n` +
    `Your ONLY job: read the user message and output ONE JSON object. No other text.\n\n` +
    `Current time: ${now.toISOString()} (local: ${localIso(now)})\n\n` +
    `TOOLS:\n${tools}\n\n` +
    `OUTPUT — exactly this shape, nothing else:\n` +
    `{"tool": "<one of: ${TOOL_ORDER.join(', ')}>", "args": { ... }}\n\n` +
    `RULES:\n` +
    `- Output valid JSON only. No markdown fences, no explanation, no trailing text.\n` +
    `- "args" must contain ONLY properties from the tool's schema.\n` +
    `- "datetime_iso" must be ISO 8601 WITH timezone offset and in the FUTURE (after the current time above). If the user gives no time for a reminder, use tomorrow at 09:00 local.\n` +
    `- Prefer the most specific tool. When in doubt, use "none".`
  );
}

/**
 * System prompt for conversational replies grounded in recalled memory.
 * The model must answer ONLY from the provided memory context.
 */
export function buildChatPrompt(memoryContext: string): string {
  const mem = memoryContext.trim() ? memoryContext.trim() : '(no relevant memory)';
  return (
    `You are Vault, a warm, concise private AI assistant running entirely on the user's phone.\n` +
    `Answer using ONLY the memory below. If the memory doesn't contain the answer, say you don't remember that yet — never invent facts. ` +
    `Keep replies short (1-3 sentences) unless the user asks for detail.\n\n` +
    `MEMORY:\n${mem}`
  );
}
