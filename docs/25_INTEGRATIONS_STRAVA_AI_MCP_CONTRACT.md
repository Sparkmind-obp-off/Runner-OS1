# Runner OS — Integrations: Strava, AI Providers, Gateway & MCP

Status: target contract. Existing Strava normalizer/import connector is not live OAuth or sync.

## Integration pattern
UI → authenticated API → application service → internal port → provider adapter. Provider-specific formats must not leak into domain/UI.

Every adapter defines capability, auth/scopes, owner mapping, limits, timeout/retry, idempotency, provenance, freshness, disconnect/revocation and retention.

## Strava current truth
Repository has activity normalization/import and external-ID deduplication. OAuth, encrypted token lifecycle, real account connection and production sync are not complete until verified. Never label foundation as live integration.

## OAuth contract
1. Authenticated owner initiates connection.
2. Server generates cryptographically random, short-lived, one-time state bound to owner and browser session.
3. Redirect to official Strava authorization with registered HTTPS callback.
4. Start with activity:read. Request activity:read_all only when private activity access is needed and explicitly consented.
5. Callback validates state, exchanges code server-to-server and validates athlete identity and granted scopes.
6. Encrypt access/refresh tokens using AES-GCM with key from Worker Secret.
7. Store ciphertext, nonce, key version, expiry and granted scopes only.
8. Refresh before expiry and atomically persist rotated refresh token.
9. Handle denial, invalid state, token expiry, rate limit, deauthorization and disconnect.

Never ask for client secret or tokens in chat or commit them.

## Sync contract
First sync imports a bounded recent window, then paginates within limits. Later sync uses cursor/watermark plus overlap for late updates. Import supported running activity types only. Deduplicate by owner/provider/external activity ID. Normalize timestamp, moving/elapsed time, distance, elevation and pace while preserving nulls. Store source and import time.

Queue background work; use Workflow for long sync/retry/recovery. Use Strava webhooks for create/update/delete/deauthorization when available. Verify webhook challenge/signature as specified, make events idempotent and reconcile with incremental sync. Avoid aggressive polling.

Disconnect stops sync, revokes/deauthorizes as supported, removes encrypted tokens and cursor, and applies a transparent user choice for imported data deletion/retention.

Read-only only. No upload, edit, delete, kudos, comments or write scopes. Follow Strava API terms and data use policy.

Official docs:
https://developers.strava.com/docs/getting-started/
https://developers.strava.com/docs/authentication/
https://developers.strava.com/docs/webhooks/
https://www.strava.com/legal/api

## AI provider abstraction
Existing AIProvider port and Groq adapter remain. Potential providers: Groq, Workers AI, OpenAI, Anthropic, Gemini and others only after credentials, terms, quality, latency and cost review.

Routing is deterministic and task-based first. Configure allowlisted provider/model per task, max tokens, timeout, retries and cost ceiling. Fallback only to owner-enabled provider. Never silently switch to paid provider or increase spend. Log model/provider, latency and usage metadata while redacting content and secrets.

## Cloudflare AI Gateway
Use for observability, routing where supported, analytics, rate controls and safe caching. Gateway does not erase provider API differences. Keep provider adapters. Do not cache private personalized prompts/responses by default.

## Workers AI
Benchmark supported models for suitable tasks such as low-risk classification or summarization. Verify current model availability, tool calling, structured output, context window and price at implementation time.

## MCP
MCP is tool interoperability, not authorization. Add only when a concrete server adds value, schema and permissions are constrained, owner identity comes from trusted server context, calls are audited and destructive actions require approval. Never expose raw D1, Strava tokens or unrestricted app APIs.

## Framework decision
Cloudflare Agents SDK + Workflows is first runtime candidate. LangGraph.js is optional if graph orchestration exceeds native patterns. LangChain.js is optional convenience, not required by current provider adapter. CrewAI is deferred due separate Python runtime and operational boundary. No framework is canonical domain model or database.

## Acceptance
Secrets remain server-side; least privilege and consent; outage does not corrupt records; retries are idempotent; disconnect works; status is truthful; logs are redacted.
