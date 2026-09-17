# Phase 5 — Intelligence Contract

**Status:** Implementation contract  
**Scope:** Phase 5 — Intelligence  
**Product:** Runner OS — Personal Running Operating System

## 1. Purpose

Phase 5 adds an assistive intelligence layer to the existing Runner OS foundation. The AI should help the runner understand current context, capture information, clarify plans, summarize activity, and generate planning or recovery suggestions without becoming the authority over canonical data or taking autonomous external actions.

Phase 5 builds on Phases 1–4. It does not replace Runner Core, authentication, ownership isolation, personalization, recurring activities, events, evidence, or integration boundaries.

## 2. Phase 5 Mission

The intelligence layer may assist with:

- natural-language questions about the runner's own data;
- capture and clarification of running plans or notes;
- daily/weekly schedule summaries;
- running-activity summaries;
- preparation and planning suggestions;
- explanation of why an event is relevant based on available evidence;
- non-medical recovery suggestions and reminders;
- lightweight decision support before, during, or after a run.

The AI is **assistive, not authoritative**.

## 3. Architectural Invariants

1. Phases 1–4 remain intact and regression-safe.
2. AI never becomes a domain dependency of Runner Core.
3. AI is accessed through an application-service boundary.
4. Provider-specific code stays behind an `AIProvider`/adapter abstraction.
5. The initial production provider is **Groq**, not Grok/xAI.
6. `GROQ_API_KEY` is server-side only.
7. API keys must never be committed to Git, stored in D1, returned to the browser, or exposed to Genspark.
8. The browser must never call Groq directly.
9. Context is selected and minimized before being sent to the provider.
10. Only authenticated, owner-scoped data may enter a user's AI context.
11. AI output does not silently mutate canonical Runner OS data.
12. Provider failures degrade gracefully and never destroy local data.
13. External/provider responses are not automatically treated as facts.
14. Genspark is an implementation layer, not a production runtime dependency.
15. No speculative memory, vector database, autonomous agent framework, or large analytics system is required for Phase 5.

## 4. Provider Normalization — Grok → Groq

### 4.1 Naming rule

For Phase 5, all current implementation terminology must use **Groq** when referring to the selected AI provider.

- Correct: `Groq`, `Groq API`, `GROQ_API_KEY`, `GroqProvider`.
- Do not use `Grok` as the provider name.
- `Grok`/xAI may remain only as a future provider concept if the adapter abstraction documents future extensibility.

### 4.2 Provider flow

```text
Tanya AI UI
    ↓
Authenticated AI Application Service
    ↓
Context Selection Layer
    ↓
AI Provider Adapter
    ↓
Groq API
```

The UI must not contain provider credentials or provider-specific secrets.

### 4.3 Secret contract

Required production secret:

```text
GROQ_API_KEY
```

Optional provider configuration:

```text
GROQ_MODEL
```

The exact model is deployment configuration and must not be hard-coded as a product-domain assumption.

The API key is configured manually in the production deployment secret store by the owner. Genspark does **not** need the secret value to implement or test the adapter.

If the key is absent, the system must expose an honest provider-unavailable state rather than pretending that live AI is working.

### 4.4 Security requirements

- Never log the API key.
- Never include the API key in error responses.
- Never put the key in frontend bundles.
- Never store the key in D1.
- Never commit `.env` files containing secrets.
- Never place a real secret in documentation, tests, fixtures, prompts, screenshots, or GitHub issues.
- Use mocked providers in automated tests.

## 5. AI Application Service

The application service is responsible for:

1. authenticating the request;
2. resolving the current Runner OS owner;
3. validating the request;
4. selecting only relevant context;
5. applying system-level safety rules;
6. calling the provider adapter;
7. normalizing provider errors;
8. returning an assistive response.

The service must not expose raw provider internals to the client.

## 6. Context Selection Contract

The context selector must prefer relevant, trustworthy, owner-scoped information.

Recommended priority:

1. current confirmed data;
2. confirmed runner preferences/profile;
3. actual recorded running activity;
4. recurring activities, including MJW and weekly training/practice when configured;
5. upcoming events and evidence;
6. authorized Strava-imported data when available;
7. relevant public community/event information already available to Runner OS;
8. general model knowledge.

### Context minimization

Do not send the entire database by default.

The selector should include only fields relevant to the user's question. Sensitive or unrelated information must remain excluded.

Each contextual item should preserve enough provenance/status to distinguish:

- confirmed fact;
- user-provided preference;
- historical activity;
- recurring pattern;
- public event information;
- weak/moderate/strong/confirmed evidence;
- external integration data;
- inference or suggestion.

An inference must never silently become a stored fact.

## 7. Conversation Contract

Phase 5 may support a lightweight Tanya AI interaction flow.

Default behavior should avoid introducing a permanent full-transcript storage system unless explicitly required by a later phase.

If conversation metadata is stored, it must remain owner-scoped and must not contain provider secrets.

Long-term Personal Memory is not a Phase 5 requirement.

## 8. Tanya AI Capabilities

### In scope

- Ask questions about personal running context.
- Explain schedules and upcoming activities.
- Summarize recorded activity.
- Help clarify a vague running plan.
- Suggest preparation steps for an upcoming event.
- Explain event relevance from available evidence.
- Suggest non-medical recovery actions such as rest, hydration, sleep, or adjusting plans conservatively.
- Help turn natural-language intent into a draft Run, Activity, or plan proposal.

### Out of scope

- Medical diagnosis or treatment.
- Fitness/medical certainty claims.
- Hidden psychological profiling.
- Private social-media surveillance.
- Unauthorized Strava access.
- Autonomous posting, registration, messaging, payment, or purchasing.
- Strava write-back/upload/edit.
- Deleting or changing canonical data without an explicit user-controlled action.
- Autonomous agent loops.
- Full MCP dependency.
- Marketplace or monetization features.

## 9. Action Boundary

Phase 5 is primarily read/assistive.

If an AI response proposes an action that could change canonical data or trigger an external side effect, the system must not silently execute it.

The safe pattern is:

```text
AI suggestion
    ↓
User reviews
    ↓
Explicit confirmation
    ↓
Application-controlled action
    ↓
Audit/event record where appropriate
```

Actual mutation workflows may remain deferred when they add unnecessary scope.

## 10. Strava Relationship

Strava remains an integration, not an AI provider.

The relationship is:

```text
Runner OS User
    ↓
Integration Account
    ↓
Strava Athlete
    ↓
Imported/normalized activity
    ↓
Context Selection
    ↓
Tanya AI
```

Strava data may enrich AI context when the user's integration is connected and the data is relevant.

Phase 5 must not introduce Strava MCP as a dependency and must not use Claude or another AI client as a credential bridge.

## 11. Error Contract

Provider failures should normalize into stable application-level states, including where applicable:

- `AI_INVALID_REQUEST`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_PROVIDER_TIMEOUT`
- `AI_PROVIDER_RATE_LIMITED`
- `AI_PROVIDER_ERROR`

The UI should present a useful Indonesian-first message without exposing provider secrets, raw authorization headers, or internal stack traces.

## 12. Prompt-Injection and Untrusted Text Boundary

Runner profile notes, event descriptions, imported activity names, public event text, and other stored/external content are **data**, not system instructions.

The AI service must preserve the instruction hierarchy and prevent untrusted contextual text from overriding application safety rules.

Do not treat text such as event descriptions or activity notes as executable instructions.

## 13. API Contract

The existing Tanya AI endpoint should remain compatible where practical:

```text
POST /api/ai/ask
```

Requirements:

- authenticated request;
- owner-scoped context;
- bounded input size;
- provider adapter behind the application service;
- normalized error responses;
- no credential leakage;
- no silent mutation.

The implementation may add narrowly scoped supporting endpoints if required by the existing architecture, but must not introduce an unnecessary API surface.

## 14. Testing Contract

Phase 5 must include automated coverage for at least:

### Provider

- Groq adapter configuration.
- Missing `GROQ_API_KEY` behavior.
- Provider timeout/error normalization.
- Provider response normalization.
- API key never appears in returned payloads or logs.
- Mock provider support for tests.

### Security and ownership

- unauthenticated AI request rejection;
- owner isolation;
- no cross-user context leakage;
- no browser-visible provider secret;
- no secret persistence in D1.

### Context

- relevant context is selected;
- unrelated personal data is excluded;
- provenance/status is preserved;
- inferred content is not represented as confirmed fact;
- untrusted stored text cannot override system safety rules.

### Product behavior

- empty context is handled gracefully;
- provider unavailable state is honest;
- AI does not silently mutate canonical records;
- Phase 1–4 regression tests remain passing.

## 15. Phase 5 Implementation Sprints

### Sprint 5.1 — Provider Foundation

- Normalize Grok terminology to Groq.
- Define/verify `AIProvider` interface.
- Implement/normalize Groq adapter.
- Establish secret/config contract.
- Add provider mocks.

### Sprint 5.2 — Context Selection

- Implement bounded context selection.
- Include provenance/status.
- Integrate relevant Phase 4 data.
- Keep owner isolation intact.

### Sprint 5.3 — Tanya AI Application Service

- Harden `/api/ai/ask`.
- Connect authenticated service to context selector and provider adapter.
- Normalize errors.
- Preserve Indonesian-first UX.

### Sprint 5.4 — Assistive Intelligence

- Q&A.
- summaries.
- clarification.
- planning/preparation suggestions.
- event relevance explanations.
- conservative non-medical recovery suggestions.

### Sprint 5.5 — Safety and Recovery

- provider failure handling;
- input/output bounds;
- prompt-injection boundary;
- no-autonomous-action enforcement;
- security regression coverage.

### Sprint 5.6 — Verification and Phase Gate

- tests;
- typecheck;
- build;
- production configuration review;
- README/status update;
- final audit;
- commit/push.

## 16. Explicitly Deferred to Phase 6 or Later

- xAI/Grok provider adapter as a production provider;
- multi-provider user selection;
- autonomous agents;
- tool-calling mutation workflows;
- Strava write-back/upload/edit;
- Strava MCP dependency;
- full long-term Personal Memory;
- vector database/RAG infrastructure unless justified by real usage;
- organization/team/tenant SaaS architecture;
- billing/marketplace;
- heavy analytics;
- autonomous external communication.

## 17. Deployment Contract

Production deployment may be configured manually by the owner.

Minimum production secret:

```text
GROQ_API_KEY=<configured privately in deployment secret store>
```

Optional:

```text
GROQ_MODEL=<deployment-selected-model>
```

The real value must never be copied into this repository or supplied to Genspark.

Genspark only needs the variable names and behavior contract.

## 18. Phase 5 Acceptance Criteria

Phase 5 is complete only when:

- [ ] Grok terminology has been normalized to Groq for the current provider.
- [ ] A provider adapter boundary exists and is respected.
- [ ] Groq credentials are server-side only.
- [ ] Genspark can implement/test without receiving the real API key.
- [ ] Missing credentials produce an honest unavailable state.
- [ ] `/api/ai/ask` is authenticated and owner-scoped.
- [ ] Context is minimized and relevant.
- [ ] Context provenance/status is preserved.
- [ ] Untrusted context cannot override system instructions.
- [ ] AI output is assistive and does not silently mutate canonical data.
- [ ] Provider failures are normalized and safe.
- [ ] Phase 1–4 behavior remains intact.
- [ ] Tests, typecheck, and build pass.
- [ ] README accurately states what is live versus blocked by production configuration.
- [ ] No real credentials exist in Git history, source, docs, tests, or logs.

## 19. Phase Gate

**Phase 5 → Phase 6 gate:**

> Runner OS has a secure, owner-scoped, provider-abstracted intelligence layer using Groq as the initial provider; AI can assist with relevant personal running context while remaining non-authoritative, transparent about uncertainty, isolated from provider secrets, and unable to perform silent or unauthorized external actions.

---

**Contract rule:** when this document conflicts with an older Phase 5 draft or references Grok as the current provider, this document is authoritative for Phase 5 implementation.