/**
 * create_reminder tool — schedules a local (on-device) notification via
 * expo-notifications. Side-effecting: it changes something outside the app,
 * so it always requires user confirmation upstream.
 */
import * as Notifications from 'expo-notifications';
import type { ToolContext, ToolDefinition } from './types';

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export const createReminderTool: ToolDefinition = {
  name: 'create_reminder',
  description: 'Set a reminder: schedule a notification on this device at a specific date and time.',
  sideEffecting: true,

  async execute(args, ctx: ToolContext) {
    const title = asString(args.title);
    const datetimeIso = asString(args.datetime_iso);
    if (!title || !datetimeIso) {
      return { ok: false, summary: '', error: 'Missing required arguments: title, datetime_iso.' };
    }
    const date = new Date(datetimeIso);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, summary: '', error: `Invalid datetime_iso: "${datetimeIso}".` };
    }
    if (date.getTime() <= Date.now()) {
      return { ok: false, summary: '', error: 'The reminder time must be in the future.' };
    }

    try {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) {
        return {
          ok: false,
          summary: '',
          error: 'Notification permission denied. Enable notifications in Settings to set reminders.',
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: { title: 'Vault reminder', body: title },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });

      const summary = `Reminder set: "${title}" at ${date.toLocaleString()}.`;
      await ctx.audit({
        tool: 'create_reminder',
        summary,
        tier: ctx.tier,
        leftDevice: false,
        detail: JSON.stringify({ notificationId, datetime_iso: datetimeIso }),
      });
      return { ok: true, summary, data: { notificationId } };
    } catch (e) {
      return {
        ok: false,
        summary: '',
        error: e instanceof Error ? e.message : 'Failed to schedule the reminder.',
      };
    }
  },
};
