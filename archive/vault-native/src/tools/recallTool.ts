/**
 * recall_memory tool — searches the private on-device memory.
 * NOT side-effecting (read-only): no confirmation required, audit-logged.
 */
import type { RecallHit } from '../memory/types';
import type { ToolContext, ToolDefinition } from './types';

const SNIPPET_LEN = 80;
const MAX_HITS_SHOWN = 3;

export function makeRecallTool(
  recall: (query: string) => Promise<RecallHit[]>,
): ToolDefinition {
  return {
    name: 'recall_memory',
    description: 'Search your private on-device memory for notes about a topic.',
    sideEffecting: false,

    async execute(args, ctx: ToolContext) {
      const query = typeof args.query === 'string' ? args.query.trim() : '';
      if (!query) {
        return { ok: false, summary: '', error: 'Missing required argument: query.' };
      }

      const hits = await recall(query);
      await ctx.audit({
        tool: 'recall_memory',
        summary: `Memory search: "${query}" (${hits.length} hit${hits.length === 1 ? '' : 's'})`,
        tier: ctx.tier,
        leftDevice: false,
      });

      if (hits.length === 0) {
        return { ok: true, summary: 'Nothing found about that yet.', data: { count: 0 } };
      }

      const snippets = hits
        .slice(0, MAX_HITS_SHOWN)
        .map((h) => h.note.body.slice(0, SNIPPET_LEN).replace(/\s+/g, ' ').trim());
      const summary = snippets.map((s, i) => `${i + 1}. ${s}`).join('\n');
      return {
        ok: true,
        summary,
        data: { count: hits.length, noteIds: hits.slice(0, MAX_HITS_SHOWN).map((h) => h.note.id) },
      };
    },
  };
}
