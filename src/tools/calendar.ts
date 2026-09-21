/**
 * create_event tool — creates a calendar event on the device via expo-calendar.
 * Uses the v57 class API: requestCalendarPermissions() → getCalendars() →
 * ExpoCalendar.createEvent(). Side-effecting: requires user confirmation.
 */
import * as Calendar from 'expo-calendar';
import type { ToolContext, ToolDefinition } from './types';

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function asMinutes(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.round(v);
  return null;
}

export const createEventTool: ToolDefinition = {
  name: 'create_event',
  description: 'Add a calendar event on this device at a specific date and time.',
  sideEffecting: true,

  async execute(args, ctx: ToolContext) {
    const title = asString(args.title);
    const datetimeIso = asString(args.datetime_iso);
    if (!title || !datetimeIso) {
      return { ok: false, summary: '', error: 'Missing required arguments: title, datetime_iso.' };
    }
    const durationMin = asMinutes(args.duration_min) ?? 60;

    const startDate = new Date(datetimeIso);
    if (Number.isNaN(startDate.getTime())) {
      return { ok: false, summary: '', error: `Invalid datetime_iso: "${datetimeIso}".` };
    }
    const endDate = new Date(startDate.getTime() + durationMin * 60_000);

    try {
      const perm = await Calendar.requestCalendarPermissions();
      if (!perm.granted) {
        return {
          ok: false,
          summary: '',
          error: 'Calendar permission denied. Enable calendar access in Settings to add events.',
        };
      }

      const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications);
      if (!writable) {
        return {
          ok: false,
          summary: '',
          error: 'No writable calendar found on this device.',
        };
      }

      const event = await writable.createEvent({ title, startDate, endDate });

      const summary = `Calendar event: "${title}" on ${startDate.toLocaleString()} (${durationMin} min).`;
      await ctx.audit({
        tool: 'create_event',
        summary,
        tier: ctx.tier,
        leftDevice: false,
        detail: JSON.stringify({ eventId: event.id, calendarId: writable.id, datetime_iso: datetimeIso }),
      });
      return { ok: true, summary, data: { eventId: event.id } };
    } catch (e) {
      return {
        ok: false,
        summary: '',
        error: e instanceof Error ? e.message : 'Failed to create the calendar event.',
      };
    }
  },
};
