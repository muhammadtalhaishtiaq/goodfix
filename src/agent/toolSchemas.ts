import type { ToolName } from './types';

/**
 * JSON Schema (draft 2020-12 subset) for each tool's args.
 * Used in the router prompt and as the forced-JSON schema for on-device
 * model calls. The validator (validator.ts) enforces the same rules in code,
 * so the schema and validator must stay in sync.
 */
export const TOOL_SCHEMAS: Record<ToolName, object> = {
  create_reminder: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    description: 'Schedule a local reminder / notification on the device.',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        description: 'What the user wants to be reminded about.',
      },
      datetime_iso: {
        type: 'string',
        format: 'date-time',
        description:
          'ISO 8601 date-time WITH timezone offset, in the future (e.g. 2026-09-21T09:00:00-04:00).',
      },
    },
    required: ['title', 'datetime_iso'],
    additionalProperties: false,
  },
  create_event: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    description: 'Add an event to the device calendar.',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        description: 'Event title.',
      },
      datetime_iso: {
        type: 'string',
        format: 'date-time',
        description:
          'ISO 8601 date-time WITH timezone offset, in the future.',
      },
      duration_min: {
        type: 'integer',
        minimum: 1,
        description: 'Duration in minutes. Defaults to 60 when omitted.',
      },
    },
    required: ['title', 'datetime_iso'],
    additionalProperties: false,
  },
  save_note: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    description: 'Store a note in the private on-device memory.',
    properties: {
      body: {
        type: 'string',
        minLength: 1,
        maxLength: 5000,
        description: 'The note text to remember.',
      },
    },
    required: ['body'],
    additionalProperties: false,
  },
  recall_memory: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    description: 'Search the private on-device memory.',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        description: 'What to search memory for.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  none: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    description:
      'No tool needed: greetings, chit-chat, or anything answerable conversationally.',
    properties: {},
    additionalProperties: false,
  },
};
