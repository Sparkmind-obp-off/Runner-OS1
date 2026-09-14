# 07 — Security & Ownership

## Identity

Every user-owned Run, Activity, Event, and Integration Link must be scoped to an authenticated owner. Authorization must be enforced server-side.

## Secrets

- Never expose provider OAuth client secrets or refresh tokens to the browser.
- Never commit secrets to Git.
- Production secrets belong in the deployment secret manager/environment.
- Logs must not contain access tokens, authorization codes, or sensitive provider payloads.

## Data ownership

The user owns their Runner OS data. External providers remain authoritative for their own provider records. Runner OS stores only the external data needed for the declared product behavior.

## Auditability

State-changing operations should create events with actor, action, timestamp, and relevant before/after state.

## Safe AI behavior

AI can suggest:
- Run titles
- categorization
- priorities
- next actions
- summaries

AI should not silently:
- delete user data
- complete important Runs
- revoke integrations
- overwrite external records
- expose secrets

Consequential actions require explicit confirmation or a narrowly scoped, user-configured automation policy.

## Recovery

Important writes should be transactional. Failed integrations must be recoverable without losing canonical Runner Core data.
