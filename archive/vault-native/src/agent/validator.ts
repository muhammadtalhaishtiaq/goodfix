import type { ToolName, ValidationResult } from './types';

/**
 * Hand-rolled argument validation (no dependencies). Mirrors TOOL_SCHEMAS:
 * required fields, types, datetime_iso parses and is future-dated for
 * reminder/event, body/query non-empty with length caps. Unknown fields are
 * stripped — the returned `args` are the sanitized object to execute.
 */

const KNOWN_TOOLS: readonly ToolName[] = [
  'create_reminder',
  'create_event',
  'save_note',
  'recall_memory',
  'none',
];

const MAX_BODY_CHARS = 5000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Trimmed string, or null when missing/blank. */
function nonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Validates an ISO 8601 date-time that must lie in the future.
 * Returns the trimmed string, or null (after pushing an error).
 */
function checkFutureIso(
  v: unknown,
  field: string,
  errors: string[],
): string | null {
  if (typeof v !== 'string' || v.trim().length === 0) {
    errors.push(`${field} must be a non-empty string`);
    return null;
  }
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) {
    errors.push(`${field} must be a valid ISO 8601 date-time`);
    return null;
  }
  if (ms <= Date.now()) {
    errors.push(`${field} must be in the future`);
    return null;
  }
  return v.trim();
}

/** Optional positive whole minutes; coerces numeric strings. */
function checkDurationMin(v: unknown, errors: string[]): number | undefined {
  if (v === undefined) return undefined;
  let n: number;
  if (typeof v === 'number') {
    n = v;
  } else if (
    typeof v === 'string' &&
    v.trim() !== '' &&
    Number.isFinite(Number(v.trim()))
  ) {
    n = Number(v.trim());
  } else {
    errors.push('duration_min must be a positive whole number of minutes');
    return undefined;
  }
  if (!Number.isInteger(n) || n < 1) {
    errors.push('duration_min must be a positive whole number of minutes');
    return undefined;
  }
  return n;
}

export function validateToolCall(
  tool: unknown,
  args: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (typeof tool !== 'string' || !KNOWN_TOOLS.includes(tool as ToolName)) {
    return { ok: false, errors: [`unknown tool: ${String(tool)}`] };
  }
  const name = tool as ToolName;

  if (!isRecord(args)) {
    return { ok: false, errors: ['args must be an object'] };
  }

  switch (name) {
    case 'create_reminder': {
      const clean: Record<string, unknown> = {};
      const title = nonEmptyString(args.title);
      if (title === null) errors.push('title must be a non-empty string');
      else clean.title = title;
      const dt = checkFutureIso(args.datetime_iso, 'datetime_iso', errors);
      if (dt !== null) clean.datetime_iso = dt;
      if (errors.length > 0) return { ok: false, errors };
      return { ok: true, errors: [], args: clean };
    }

    case 'create_event': {
      const clean: Record<string, unknown> = {};
      const title = nonEmptyString(args.title);
      if (title === null) errors.push('title must be a non-empty string');
      else clean.title = title;
      const dt = checkFutureIso(args.datetime_iso, 'datetime_iso', errors);
      if (dt !== null) clean.datetime_iso = dt;
      const dur = checkDurationMin(args.duration_min, errors);
      if (dur !== undefined) clean.duration_min = dur;
      if (errors.length > 0) return { ok: false, errors };
      return { ok: true, errors: [], args: clean };
    }

    case 'save_note': {
      const body = nonEmptyString(args.body);
      if (body === null) {
        errors.push('body must be a non-empty string');
        return { ok: false, errors };
      }
      if (body.length > MAX_BODY_CHARS) {
        errors.push(`body must be at most ${MAX_BODY_CHARS} characters`);
        return { ok: false, errors };
      }
      return { ok: true, errors: [], args: { body } };
    }

    case 'recall_memory': {
      const query = nonEmptyString(args.query);
      if (query === null) {
        errors.push('query must be a non-empty string');
        return { ok: false, errors };
      }
      return { ok: true, errors: [], args: { query } };
    }

    case 'none': {
      // No-op: strip everything, never an error.
      return { ok: true, errors: [], args: {} };
    }
  }
}
