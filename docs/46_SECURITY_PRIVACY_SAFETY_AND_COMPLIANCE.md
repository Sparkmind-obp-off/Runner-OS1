# 46 — Security, Privacy, Safety & Compliance Requirements

## Security baseline
Verify identity server-side; never trust client tenant IDs; enforce owner checks in every query/mutation; secure cookies/JWT, CSRF and origin checks; rate-limit auth, AI, exports and writes; store secrets only in platform secret manager; rotate and redact; validate inputs and parameterize SQL; maintain dependency scanning, migrations, backups and restore drills; audit privileged actions; test cross-tenant access, session revocation, replay, IDOR, injection and quota bypass.

## Privacy requirements
Publish purpose, categories, retention, processors, transfers, rights, contact and deletion process. Obtain consent where required. Minimize collection. Do not collect precise location or health data unless required and knowingly enabled. Do not sell or repurpose personal running data for advertising without lawful basis and clear disclosure.

## Running safety boundaries
Runner OS is informational and organizational, not a medical device or clinical service. It must not diagnose, treat, prevent or clear injuries. Suggestions should be conservative, explain assumptions and encourage professional advice for pain, symptoms, pregnancy, chronic conditions or return from injury. Emergency symptoms require local emergency services, not AI. No performance or injury-avoidance guarantee.

## Strava policy gate
Doc 29 remains the controlling policy decision. Do not enable Strava API data in AI/agent context, including prompt context, grounding, RAG, embeddings, evaluation, summaries or recommendations. Do not re-expose API data through MCP, proxy or aggregator. Product competition concerns require written clearance for the precise use case before live API integration. Consent and app tier do not independently waive restrictions. Keep native/manual data first-class.

## Legal readiness
Docs 34 and 35 are drafts, not legal approval. Obtain qualified local legal review for privacy, consumer, subscription, health-adjacent claims, data protection, electronic systems and payment obligations in target jurisdictions. Confirm controller/processor roles and cross-border transfer terms.

## Incident handling
Document severity, containment, credential rotation, evidence preservation, affected-user assessment, notification obligations, recovery and postmortem. Test runbook before public launch.

## Release blockers
No public SaaS launch until tenant isolation, account export/deletion, privacy notice, terms, consent, rate limits, security tests, incident process and provider contracts are verified.
