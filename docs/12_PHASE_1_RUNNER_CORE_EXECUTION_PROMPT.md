# Runner OS — Phase 1 Runner Core Execution Prompt

## Mission

Build the first real Runner OS vertical slice: **Runner Core**.

The objective is not to produce a visual mockup. The objective is a working application where an authenticated user can create and operate Runs safely, with persistent state, event history, and automated tests.

## Read First

Before coding, read:

- `README.md`
- `docs/01_PRODUCT_CONCEPT.md`
- `docs/02_MVP_PRD.md`
- `docs/03_ARCHITECTURE_BLUEPRINT.md`
- `docs/04_RUNNER_CORE_DATA_MODEL.md`
- `docs/05_UX_FLOW.md`
- `docs/06_CONNECTOR_CONTRACT.md`
- `docs/07_SECURITY_AND_OWNERSHIP.md`
- `docs/08_ROADMAP_AND_PHASE_GATES.md`
- `docs/09_GENSPARK_IMPLEMENTATION_PROMPT.md`
- `docs/10_TESTING_AND_ACCEPTANCE.md`
- `docs/11_GENSPARK_MASTER_SYSTEM_PROMPT.md`

If the existing project scaffold is empty, choose a conventional maintainable web stack that is practical for production deployment. Do not introduce unnecessary infrastructure.

## Scope: Phase 1 Only

### A. Foundation

Create the application structure, package configuration, environment contract, development instructions, and production-safe configuration.

Required:

- reproducible install/build commands;
- `.env.example` or equivalent without real secrets;
- clear separation of server and client configuration;
- database migration mechanism;
- test runner;
- basic error handling.

### B. Authentication and Ownership

Implement the minimum authentication mechanism required for a real single-user-owned application that can safely evolve to multi-user use.

Every Run and Run Event must be scoped to the authenticated owner.

Required acceptance behavior:

- unauthenticated requests cannot access protected Run data;
- User A cannot read, update, or delete User B's Runs;
- authorization is enforced server-side, not only by UI filtering.

### C. Runner Core Domain

Implement the canonical Run entity.

Minimum fields:

- `id`
- `ownerId`
- `title`
- `type`
- `outcome`
- `status`
- `priority`
- `nextAction`
- `progress`
- `blocker`
- `dueAt` or equivalent optional due/review timestamp
- `createdAt`
- `updatedAt`

Supported Run types:

- project
- task_stream
- habit
- fitness
- learning
- hobby
- custom

Supported statuses:

- planned
- active
- paused
- blocked
- completed
- archived

Supported priorities:

- low
- normal
- high
- critical

Progress must be validated to a sensible bounded range, normally 0–100.

### D. Lifecycle Rules

Implement domain-level transition validation.

Allowed lifecycle:

`planned → active`

`active → completed`

`planned → active → paused → active`

`active → blocked → active`

`active → paused`

`paused → completed`

`blocked → completed`

`active/paused/blocked → archived`

Invalid transitions must fail with a predictable domain/application error.

Do not rely on frontend button visibility as the lifecycle enforcement mechanism.

### E. Run Events / History

Create an append-oriented Run Event model sufficient to explain important state changes.

At minimum capture:

- event ID;
- Run ID;
- owner ID;
- event type;
- previous state where relevant;
- new state where relevant;
- timestamp;
- structured metadata when useful.

Important lifecycle mutations should create events.

History must be readable from the Run detail experience.

### F. Application Use Cases

Implement clear application-level operations for:

- create Run;
- get Run;
- list Runs;
- update Run metadata;
- start Run;
- pause Run;
- block Run;
- resume Run;
- complete Run;
- archive Run;
- update next action;
- update progress;
- read Run history.

Keep lifecycle decisions in domain/application logic rather than duplicating them in UI components.

### G. API / Server Contract

Expose protected server operations for the above use cases.

Requirements:

- validate request input;
- enforce authentication;
- enforce ownership;
- return stable machine-readable error categories;
- do not leak internal exceptions or secrets;
- use transactional writes when a lifecycle mutation updates both Run state and its event.

### H. Today Dashboard

Build the smallest useful Today experience.

It must answer: **“What should I run now?”**

Show at minimum:

- active/high-priority Runs;
- next actions;
- blocked Runs;
- paused Runs that can be resumed;
- recent progress or changes.

Do not turn Today into a generic productivity dashboard with unrelated features.

### I. Run Detail

The Run detail screen must show:

- title/type;
- outcome;
- status;
- priority;
- progress;
- next action;
- blocker when present;
- lifecycle actions appropriate to the current state;
- history/timeline.

Recovery must be explicit:

`blocked → identify blocker → set next action → resume`

### J. Automated Tests

Tests are mandatory before declaring Phase 1 complete.

#### Domain tests

Test every valid lifecycle transition and representative invalid transitions.

#### API/application tests

Test:

- create/get/list/update;
- authentication protection;
- ownership isolation;
- lifecycle mutations;
- invalid transition rejection;
- progress validation;
- event creation;
- transaction consistency for state + event.

#### Security tests

At minimum verify:

- unauthenticated access fails;
- cross-owner access fails closed;
- secrets are not returned in API payloads;
- sensitive credentials are absent from client bundles/logging where applicable.

#### UX smoke/acceptance test

Verify this complete journey:

1. create Run;
2. set outcome and next action;
3. start Run;
4. update progress;
5. block Run;
6. set/adjust next action for recovery;
7. resume Run;
8. complete Run;
9. inspect history.

## Explicit Non-Goals

Do NOT implement in this phase:

- Strava OAuth;
- Calendar integration;
- GitHub integration;
- autonomous AI actions;
- social features;
- complex project-management methodologies;
- medical/clinical tracking;
- large analytics systems;
- unnecessary microservices;
- production dependency on a Genspark sandbox.

## Definition of Done

Phase 1 is complete only if all are true:

- Runner Core is persistent;
- authenticated ownership works;
- Run CRUD works;
- valid lifecycle transitions work;
- invalid lifecycle transitions are rejected server-side;
- progress, next action, and blocker work;
- important lifecycle changes create history events;
- Today dashboard works;
- Run detail works;
- recovery flow works;
- automated tests pass;
- production environment contract is documented;
- no secrets are committed;
- build/type/lint checks pass where configured.

## Stop Conditions

Stop and report a blocker instead of silently changing the architecture when:

- a required dependency cannot be configured safely;
- authentication/authorization cannot be verified;
- database persistence is unreliable;
- a specification conflict materially changes Runner Core;
- an acceptance criterion cannot be tested.

A visually complete UI without verified domain/API/security behavior is **NOT COMPLETE**.

## Required Final Report

At the end of the Phase 1 session, produce/update a concise status report containing:

1. implementation summary;
2. files/modules created or changed;
3. database/migrations;
4. API/use cases;
5. tests executed and results;
6. acceptance criteria status;
7. known limitations/blockers;
8. exact next recommended phase/task.

Do not claim Phase 1 complete unless the Definition of Done is demonstrably satisfied.
