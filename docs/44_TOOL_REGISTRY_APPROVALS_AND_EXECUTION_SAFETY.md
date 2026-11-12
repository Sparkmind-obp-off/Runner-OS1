# 44 — Tool Registry, Approvals & Execution Safety

## Principle
Agents do not receive general database, network or runtime access. They invoke a server-owned registry of narrow, typed tools.

## Tool contract
Every tool defines stable name/version, description, input/output schema, read/write classification, permission scope, risk level, tenant resolver, validation, idempotency, timeout, budget cost, audit event and tests.

## Initial catalogue
| Tool | Access | Approval |
|---|---|---|
| get_profile | Read | No |
| get_activity_history | Read | No |
| calculate_activity_summary | Read/compute | No |
| draft_training_plan | Draft only | No |
| save_training_plan | Write | Yes |
| propose_schedule_change | Draft only | No |
| apply_schedule_change | Write | Yes |
| create_activity_record | Write | User initiated/confirm |
| update_profile_preferences | Write | Confirm |
| retrieve_event_evidence | Public read | No |
| create_event_milestone | Write | Yes |
| export_user_data | Sensitive read | Re-auth/confirm |
| delete_account | Destructive | Explicit confirmation and re-auth |

## Approval envelope
Include requesting user, tenant, run ID, tool name/version, validated arguments, human-readable impact, before/after diff, data sources, cost, expiry and idempotency key. Approval is bound to exact arguments; any change invalidates prior approval.

## Permission levels
read, draft, write_user_data, sensitive_export, destructive. Default to least privilege. No tool may elevate its own permissions.

## Execution controls
Server-side permission check per invocation; schema and invariant validation; idempotency; per-user/tenant rate limits; cost and step budgets; timeouts and bounded retries; circuit breakers; audit logs; approval expiry/replay protection; cancellation and compensation where feasible; secret redaction.

## Prohibited initial operations
No arbitrary SQL, shell execution, unrestricted browser control, credential extraction, social posting/messaging, event registration, payment, medical diagnosis, or third-party account actions.

## Verification
After each write, read authoritative state and compare postconditions. If verification fails, report partial completion and do not claim success. Offer undo only when a safe compensating operation exists.
