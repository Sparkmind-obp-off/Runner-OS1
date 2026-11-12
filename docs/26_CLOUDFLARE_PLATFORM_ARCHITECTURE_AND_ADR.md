# Runner OS — Cloudflare Platform Architecture & ADRs

Decision: Cloudflare-first, TypeScript-first, provider-flexible, framework-selective.

## Target platform
- Pages assets + Workers/Hono API.
- D1 canonical relational store.
- Workers Secrets for provider credentials and encryption key.
- Workflows for durable multi-step jobs, retries, waits and approval handoffs.
- Queues for asynchronous ingestion, webhooks and fan-out.
- KV for low-risk cache/config only, never canonical user data or secrets.
- AI Gateway for model observability/routing where useful.
- Workers AI for evaluated model tasks.
- Agents SDK as candidate persistent runtime.
- Durable Objects only for real per-user live coordination needs.
- R2 only for user-approved files/artifacts/exports.
- Vectorize only after semantic retrieval evaluation.
- Hyperdrive only if external PostgreSQL is adopted.
- Browser Rendering only for a specific compliant browser workflow.
- MCP only for selected external tools.

## Service matrix
| Capability | Preferred | Add gate |
|---|---|---|
| App/API | Workers + Hono | Keep |
| Canonical DB | D1 | Keep unless proven PostgreSQL gap |
| Files | R2 | Actual file requirement |
| Cache | KV | Defined cache use case |
| Durable jobs | Workflows | Agent runs/sync |
| Async decoupling | Queues | Webhook/import fan-out |
| Agent runtime | Agents SDK | POC and runtime-fit verification |
| Live coordination | Durable Objects | Measured concurrency need |
| Model control | AI Gateway | Observability/policy value |
| Inference | Workers AI + adapters | Quality/cost benchmark |
| Semantic retrieval | Vectorize | Evaluation proves benefit |
| PostgreSQL | Neon/Postgres + Hyperdrive | Specific PostgreSQL requirement |
| Browser automation | Browser Rendering | Approved use case |
| Tool interop | MCP | Per-tool security review |

## ADR-001: Keep D1
Retain D1 for MVP and first agentic release. Existing schema and workload are owner-scoped personal records. Avoid dual DB, synchronization and extra operations. Reconsider only for demonstrated PostgreSQL-specific extension/feature, workload or integration requirement. If PostgreSQL is adopted, choose one source of truth; do not split records casually.

## ADR-002: Workflows + Queues
Workflows for durable multi-step jobs, retry, wait and resume. Queues for async events and independent consumers. Do not use Queues alone for a process that must pause and resume through approval. Do not add Durable Objects preemptively.

## ADR-003: Agents SDK candidate, not lock-in
Build a small POC. Keep domain orchestration behind internal ports. If SDK does not fit Pages/Workers constraints, use Workflows and plain TypeScript services.

## ADR-004: No framework dependency initially
LangChain not needed for current provider adapter. LangGraph is a candidate only if graph/checkpoint needs exceed Workflows. CrewAI deferred because a separate Python service adds deployment, auth, secrets, monitoring and cost. Benchmark before adoption.

## ADR-005: AI Gateway and provider routing
Start with one configured provider. Add Gateway when observability/policy/routing warrants it. Use task allowlists and explicit budgets. No surprise paid fallback. No private prompt caching by default.

## ADR-006: Vectorize is not the database
Structured profile/activity/event queries remain in D1. Add embeddings only if evaluation shows a material gain over SQL/full-text. Include owner namespaces, source references and deletion propagation.

## Cost and plan governance
Product limits, Free inclusions, pricing and model catalog change. Before enabling a service, check official current price and account plan; record free allowance, limits, monthly estimate, quota behavior and alert threshold; get owner approval before paid upgrade or paid fallback.

Official references:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/workflows/reference/pricing/
https://developers.cloudflare.com/queues/platform/pricing/
https://developers.cloudflare.com/workers-ai/platform/pricing/
https://developers.cloudflare.com/vectorize/platform/pricing/
https://developers.cloudflare.com/ai-gateway/reference/pricing/
https://developers.cloudflare.com/hyperdrive/platform/pricing/
https://developers.cloudflare.com/agents/

## Environments
Separate local, preview and production databases/secrets/callbacks. Preview must never access production user data or tokens. Migrations are deliberate, not automatic on preview deploy. Record commit SHA, migration version and bindings. Health endpoint must not expose secrets or internal topology.

## Quality attributes
Owner isolation, graceful degradation, durable retry/idempotency, low operational complexity, explicit cost ceiling, replaceable adapters, redacted observability and bounded agent loops.
