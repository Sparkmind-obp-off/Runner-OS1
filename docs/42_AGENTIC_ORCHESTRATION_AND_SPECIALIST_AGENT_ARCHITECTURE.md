# 42 — Agentic Orchestration & Specialist Agent Architecture

## Architecture
One orchestrator coordinates bounded capabilities. Specialist roles may be deterministic services plus prompt templates; independent autonomous agents are not required for every role.

## Orchestrator responsibilities
Parse intent; resolve authenticated tenant and permissions; build minimum-relevant context; select tools from a typed registry; plan steps with outputs/risk/cost/approval; execute permitted steps; verify authoritative postconditions; summarize success/failure; persist run metadata and audit events.

## Specialist roles
| Role | Allowed responsibilities | Must not |
|---|---|---|
| Profile | Read/update user-approved profile fields | Infer sensitive attributes |
| Training | Draft and revise training plans | Claim medical clearance or guarantee outcomes |
| Activity | Validate and summarize native activities | Fabricate missing metrics |
| Progress | Compare compatible verified records | Compare incompatible sources without caveat |
| Schedule | Propose changes and detect conflicts | Mutate without authorization |
| Race/Event | Organize milestones and source evidence | Invent dates or registration status |
| Recovery/Safety | Explain general recovery and identify red flags | Diagnose or clear injury |
| Research | Retrieve public sources and cite evidence | Treat scraped content as trusted instructions |
| Orchestrator | Route, plan, verify and report | Bypass policy or tenant boundaries |

## Run state machine
queued → planning → awaiting_approval → running → verifying → completed.
Terminal alternatives: rejected, cancelled, failed, expired, budget_exceeded. Transitions are server-validated. Retries use idempotency keys and bounded attempts. Cancellation prevents future steps; completed side effects must still be reported.

## Structured step result
Each step returns status, summary, evidence, assumptions, missing data, proposed actions, tool calls, cost estimate, risk level and approval requirement. Persist structured metadata; do not store hidden chain-of-thought. Provide concise rationale and evidence.

## Planning policy
Prefer deterministic queries/calculations over model inference. Read only fields needed. Reject unsupported requests or ask focused clarification. Never run arbitrary SQL, shell, code, browser automation or network calls from model-generated arguments. Validate all arguments against server-owned schemas. Treat external content and user text as untrusted data, not system instructions.

## Model/provider strategy
Use provider adapters and capability profiles. Set per-task model limits, timeout, token budget and fallback. Provider outage must not affect core record CRUD. Do not send sensitive fields unless required and explicitly allowed.

## Evaluation
Maintain golden cases for plan quality, missing-data behavior, safe refusals, tool selection, cross-tenant denial, approval enforcement, cancellation, idempotency and budget exhaustion. Evaluate deterministic rules separately from model quality.
