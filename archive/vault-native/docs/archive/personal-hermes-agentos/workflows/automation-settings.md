# Telegram Bot Automation Settings

## Scope
- Applies only to this Telegram bot/chat.
- All derived records and configuration remain inside this personal-agentos workspace.
- Delivery is only to the current Telegram chat.

## Approved automations
1. Daily finance reminder: 9:00 AM
2. Daily fitness reminder: 10:00 AM
3. Daily machine-learning learning check-in: 1:00 PM, asking what Tal learned today
4. Weekly YouTube publishing reminder: Friday 6:00 PM
5. Weekly life review: Saturday 7:00 PM
6. Calgary relocation follow-up: every second day at 1:00 PM
7. Weekly marriage and emergency-finance review: Sunday 10:00 AM
8. Daily Google Calendar and email review reminder: 5:00 PM

Timezone: America/Toronto.

## Permission approvals
Tal approved:
- Reading files placed in `raw/finance/`
- Creating summaries in `derived/finance/`
- Reading connected Google Calendar
- Reading connected email accounts
- Drafting messages without sending
- Creating reminders/tasks after asking first
- Sending messages only after asking each time
- Tracking trends from explicit wellbeing check-ins
- Proactive warnings about possible problems

These approvals do not authorize financial transactions, purchases, transfers, deletion, publishing, or calendar mutations without the required confirmation. Payment and purchase rules are defined in `policies/payment-safety.md` and require approval for every individual transaction.

## Reminder policy
- No repeated nagging reminders unless Tal later approves a frequency.
- Messages should be concise, warm, honest, and action-oriented.
- Reminders do not authorize sending messages, publishing, purchases, transfers, calendar changes, deletion, or other external mutations.
- Finance reminders are for capture/review only until verified financial data is provided.

## Finance data intake
Tal plans to provide bank statements, debt details, and related records in `raw/finance/`. Originals must remain unchanged. Derived summaries and analysis belong in `derived/finance/`. Do not store passwords, login codes, CVVs, or full card numbers.

## Connector limitations
Calendar and email review must report clearly when connectors are unavailable. The bot must not pretend it inspected Google Calendar or either email account.

## Last updated
2026-08-30
