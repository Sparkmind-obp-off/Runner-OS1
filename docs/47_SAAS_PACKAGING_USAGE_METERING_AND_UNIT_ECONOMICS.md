# 47 — SaaS Packaging, Usage Metering & Unit Economics

## Pricing status
All package names, quotas and price points are hypotheses. Do not publish until cost measurement, willingness-to-pay research, payment reconciliation and support costs are validated.

## Packaging principles
Free tier delivers a useful core loop, not a broken teaser. Paid tiers sell depth, automation, capacity and convenience—not access to the user's own records. Show limits before users hit them. Provide reset period and usage history. Never silently run expensive tasks. Avoid unfunded unlimited AI promises.

## Candidate packages
| Package | Candidate value | Limits to test |
|---|---|---|
| Free | Native activity records, profile, basic schedule and insights | Small monthly AI allowance |
| Personal | Plan drafts, weekly review, more context | Monthly agent budget |
| Advanced | Specialist workflows, deeper analysis and event preparation | Higher budget/concurrency/history |
| Coach/Team (later) | Shared review with explicit consent | Seat, athlete and access controls |

## Metering model
Track per tenant/user: model tokens, model calls, workflow duration, tool calls, external Actor spend, storage, notifications and support events. Separate estimated from provider-reported actual costs.

## Unit economics
Contribution margin per paid user = net revenue − payment fees − AI/model cost − platform allocation − storage/egress − external data cost − support/refunds/tax costs.

Measure cost per activated user, weekly active runner, completed agent workflow; average and p95 workflow cost; gross margin by tier; refunds/failed payment; free-to-paid conversion/retention; abuse and abandoned-run costs.

## Guardrails
Hard monthly and per-run budget; per-task maximum; concurrency limits; timeout; retry cap; provider fallback cap; alerts at 50/80/100%; user confirmation for premium tasks. Model cannot set its own budget.

## Billing architecture
Payment webhooks must be signature-verified, idempotent and reconciled against provider state. Entitlements derive from canonical subscription state, not frontend flags. Handle pending, paid, failed, refunded, chargeback, cancelled and grace-period states.

## Pricing research
Interview users about current spend, alternatives, frequency, trust and outcomes. Test packaging concepts before exact prices. Do not infer willingness to pay from ratings or competitor list prices alone.
