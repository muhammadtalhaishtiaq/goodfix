/**
 * save_note tool — writes to the app's private on-device memory store.
 * NOT side-effecting: nothing leaves the app (writes stay inside Vault's
 * private store), so no user confirmation is required — only audit logging.
 */
import type { MemoryStore } from '../memory/types';
import type { ToolContext, ToolDefinition } from './types';

export function makeNotesTool(memory: MemoryStore): ToolDefinition {
  return {
    name: 'save_note',
    description: 'Save a note to your private on-device memory.',
    sideEffecting: false,

    async execute(args, ctx: ToolContext) {
      const body = typeof args.body === 'string' ? args.body.trim() : '';
      if (!body) {
        return { ok: false, summary: '', error: 'Note body is empty.' };
      }

      const note = await memory.save(body, 'note');
      const summary = 'Saved to your private memory.';
      await ctx.audit({
        tool: 'save_note',
        summary,
        tier: ctx.tier,
        leftDevice: false,
        detail: note.id,
      });
      return { ok: true, summary, data: { noteId: note.id } };
    },
  };
}
