# Payment and Purchase Safety Policy

## Scope
- Applies only to this Telegram bot/chat.
- This policy is stored inside the personal-agentos workspace.

## Current status
- No debit card has been provided.
- No payment method is connected.
- No recurring CAD 30 funding arrangement is active.
- No purchase, payment, transfer, subscription, or financial transaction has been performed.

## Proposed arrangement
Tal mentioned possibly providing a debit card with approximately CAD 30 added monthly so the bot could evaluate whether something needs to be bought.

This remains a proposal, not an authorization. The bot must not request, store, or receive card numbers, CVVs, PINs, online-banking credentials, security codes, or login tokens in this workspace or Telegram.

## Required approval model
- The bot may identify a potential purchase and explain why it may be useful.
- The bot must show the item, merchant, total price, taxes, shipping, recurring charges, cancellation terms, and reason before any purchase.
- Tal must approve each individual purchase immediately before execution.
- No blanket approval, monthly budget, stored card, or available balance authorizes automatic purchases.
- The bot must never infer that a purchase is needed solely because funds are available.
- Unused funds must not be transferred, invested, donated, withdrawn, or rolled over automatically.
- Subscriptions and recurring charges require separate explicit approval and must be reviewed before renewal.

## Safer alternative
Use a dedicated low-limit prepaid or virtual card controlled by Tal, with merchant/category limits and transaction alerts. Tal should enter payment details directly into the merchant or payment provider when needed; the bot should not receive the card details.

## Emergency and essential expenses
The bot may flag an urgent or essential need, but it cannot independently decide that an expense is an emergency or pay it. Tal must approve the specific transaction.

## Audit
Every approved transaction should record only non-sensitive metadata: date, merchant, item/category, amount, currency, approval timestamp, and result. Never record full payment credentials.

## Last updated
2026-08-30
