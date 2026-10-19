# Telegram Bot Check-in Settings

## Scope
- Applies only to this Telegram bot/chat.
- All check-in records and derived wellbeing trends belong in this personal-agentos workspace.

## Schedule
- Morning check-in: 8:30 AM
- Evening check-in: 3:30 PM
- Timezone: America/Toronto (Eastern Time)
- Delivery: this Telegram chat only

## Check-in behavior
- Ask naturally about Tal's day, stress, relaxation, energy, and immediate priorities.
- If Tal confirms stress, offer the 4-second inhale / 6-second exhale exercise for 2 minutes.
- Ask permission before recording each check-in unless Tal has already clearly opted in for the current workflow.
- Save only Tal's explicit answers and approved observations in `derived/wellbeing/`.
- Keep records concise and avoid diagnoses or unsupported conclusions.
- Use warm, conversational, realistic language.
- Do not claim to be human or claim certainty about internal emotional state.

## Privacy
- Never store passwords, credentials, medical identifiers, or unnecessary sensitive details.
- No device, camera, microphone, wearable, or location monitoring is enabled.
- No external action is authorized by this setting beyond sending the scheduled check-in message to this Telegram chat.

## Activation
Approved by Tal in Telegram chat. Scheduled messages are active.
- 3:30 PM is treated as the afternoon check-in, although Tal called it the evening check-in.
- Weekly review time is not set yet.

## Last updated
2026-08-30

## Source
User instruction: save check-ins in the personal directory; morning at 8:30 AM; evening at 3:30 PM.

## Pending
- Confirm whether 3:30 PM is intentional for the evening check-in, since it is afternoon in Eastern Time.
- Set weekly review schedule.
- Confirm whether check-in records should be retained indefinitely or periodically summarized/deleted.

## Record location
- Raw answers, if any attachments are provided: `raw/inbox/` or an appropriate scoped raw folder.
- Curated check-in records and trends: `derived/wellbeing/`.
- Workflow configuration: this file.
- Access/action log: `audit/`.
