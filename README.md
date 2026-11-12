# Runner OS

Runner OS adalah **Personal Running Operating System** privat yang membantu pelari memahami jadwal, rutinitas, riwayat lari, event relevan, persiapan, dan konteks personal tanpa mengubah data yang belum terkonfirmasi menjadi fakta.

## Fitur yang sudah selesai

### Fondasi Phase 1–3

- Registrasi/login email dan password dengan PBKDF2 100.000 iterasi.
- Sesi opaque 30 hari di server, cookie host-only `HttpOnly`, `SameSite=Strict`, dan `Secure` pada HTTPS.
- Owner isolation untuk semua data personal.
- Runner Core: Run CRUD, lifecycle, next action, progress, blocker, due time, daily focus, tag, pencarian, filter, dan riwayat append-oriented.
- Security headers, session bootstrap dari server, logout, dan penanganan sesi kedaluwarsa.

### Identity — Clerk Production (Google sign-in) · Doc 51

- Login/daftar dengan Google melalui Clerk Production (`clerk.runner-os.biz.id`), diverifikasi **server-side** (RS256 + JWKS, issuer, `azp`, expiry).
- Clerk subject dipetakan ke `users.id` internal yang tetap kanonik (`external_identities`); data lama tidak berpindah.
- Email yang sudah terdaftar **tidak pernah** di-link otomatis (anti-takeover) → pengguna lama masuk dengan kata sandi lalu **Profil → Hubungkan akun Google**.
- Fail-closed: tanpa `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`, tombol Google tersembunyi dan login email/kata sandi tetap berjalan.
- Status produksi lengkap, checklist DNS/Google OAuth, dan rollback: [docs/51](docs/51_CLERK_PRODUCTION_IMPLEMENTATION_STATUS.md).

### Phase 4 — Hyper-Personalized Runner OS

- Welcome sederhana dengan tindakan utama **Mulai Setup**.
- Onboarding progresif berbahasa Indonesia untuk nama panggilan, area, hari/waktu lari, jarak, tujuan, jenis event, komunitas terkonfirmasi, preferensi lari bersama, MJW, dan aktivitas mingguan.
- Setup summary yang dapat diedit sebelum diselesaikan; langkah opsional dapat dilewati.
- Runner Profile owner-scoped yang dapat diperbarui.
- Personal Home/cockpit: konteks aktivitas berikutnya, event relevan, aktivitas terakhir, persiapan, dan pintasan Tanya AI.
- Recurring Activity yang configurable, termasuk **MJW = Mlayu Jumat Wengi**, latihan, coaching, learning, dan preparation.
- Occurrence/attendance faktual dengan status `planned`, `attended`, `skipped`, atau `unknown`, terpisah dari recurrence.
- Running Activity terpisah dari Core Run; metrik jarak, durasi, pace, dan elevasi boleh kosong.
- Idempotensi aktivitas eksternal berdasarkan owner, provider/source, dan external ID.
- Event dan Event Evidence dengan provenance terpisah, relevance transparan, dan `attendancePredicted: false`.
- Normalisasi **Skybridge Race Run**; edisi 2026 tetap `November 2026 — tanggal belum terverifikasi` tanpa tanggal rekaan dan tidak diganti dengan KAI Commuter Run Jakarta.
- Strava connector foundation untuk normalisasi/import completed run dan deduplikasi; UI/status tetap jujur sebagai unavailable sampai OAuth serta penyimpanan token aman tersedia.
- Tanya AI server-side dengan context selection minimum-relevant; tidak ada panggilan provider dari browser.
- UI responsif untuk Home, aktivitas, jadwal, event, profil, integrasi, Tanya AI, serta Runner Core lama.

### Phase 5 — Assistive Intelligence

- Groq menjadi provider produksi awal melalui adapter `AIProvider`; domain Runner OS tetap provider-agnostic.
- `GROQ_API_KEY` hanya dibaca di Worker dan tidak pernah dikirim ke browser, D1, respons API, atau log.
- Context selection owner-scoped, purpose-limited, bounded, provenance-aware, dan memisahkan untrusted stored text sebagai data saja.
- Tanya AI mendukung tanya jawab, ringkasan, klarifikasi, persiapan, latihan, dan recovery non-medis.
- Structured suggestion selalu berstatus saran untuk ditinjau; endpoint AI tidak melakukan mutation dan mengembalikan `actionsExecuted: []`.
- Missing secret, timeout, rate limit, dan provider failure memakai error stabil yang jujur dan aman.

## URL

- **Local preview:** `http://localhost:3000`
- **Health:** `GET /health`
- **Production custom domain:** https://runner-os.biz.id
- **Canonical Pages origin:** https://runner-os.pages.dev
- **GitHub:** https://github.com/Sparkmind-obp-off/Runner-OS1

Deployment Phase 5 telah dipublikasikan melalui Cloudflare BYOK dan diverifikasi pada canonical Pages origin serta custom domain. Deployment-specific preview: `https://21fd46cf.runner-os.pages.dev`.

## API

Respons sukses memakai `{ "data": ... }`. Respons error memakai `{ "error": { "code", "message", "details?" } }`. Cross-owner access gagal tertutup sebagai `NOT_FOUND`.

### Authentication

- `POST /api/auth/register` — `{ email, displayName, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/config` — konfigurasi login publik (Clerk aktif/tidak, publishable key, Frontend API)
- `POST /api/auth/clerk/session` — `{ token }` token sesi Clerk → cookie sesi Runner OS
- `POST /api/auth/clerk/link` — (perlu sesi) `{ token }` hubungkan Google ke akun lama
- `GET /api/auth/identities` — (perlu sesi) status tautan Google

### Runner Core

- `GET|POST /api/runs`
- `GET|PATCH|DELETE /api/runs/:id`
- `PATCH /api/runs/:id/next-action|progress|focus`
- `POST /api/runs/:id/start|pause|block|resume|complete|archive`
- `GET /api/runs/:id/history`
- `GET /api/today?date=YYYY-MM-DD`

### Phase 4 personal running

- `GET|PUT /api/profile`
- `GET /api/home`
- `GET|POST /api/activities`
- `PUT /api/activities/:id`
- `GET|POST /api/recurring-activities`
- `PUT /api/recurring-activities/:id`
- `GET /api/recurring-activities/occurrences?from=<ISO>&to=<ISO>`
- `PUT /api/recurring-activities/:id/occurrences`
- `GET|POST /api/events`
- `PUT /api/events/:id`
- `GET /api/events/:id/context`
- `GET|POST /api/events/:id/evidence`
- `GET /api/integrations/strava`
- `POST /api/integrations/strava/connect|disconnect|sync`
- `POST /api/ai/ask` — `{ question }`; respons berisi jawaban, optional structured suggestion, provider, context policy, dan `actionsExecuted: []`

Semua endpoint Phase 4 personal memerlukan sesi dan mengambil owner dari sesi server, bukan dari request body.

## Arsitektur data

Cloudflare D1 menyimpan:

- `users`, `sessions`, `runs`, `run_events` — fondasi Phase 1–3;
- `runner_profiles` — konteks dan status onboarding;
- `recurring_activities` — definisi jadwal reusable;
- `recurring_activity_occurrences` — status aktual setiap occurrence;
- `running_activities` — sesi lari aktual/manual/impor;
- `running_events` — event personal/relevan dan status verifikasi;
- `event_evidence` — provenance sinyal minat/partisipasi;
- `integration_accounts` — connection/sync status tanpa token browser-readable.

Migrations:

1. `0001_runner_core.sql`
2. `0002_productivity_layer.sql`
3. `0003_phase4_personal_runner.sql`

Personal Memory dan full AI transcript tidak dibuat karena structured profile/activity/event data sudah cukup untuk Phase 4 dan menghindari penyimpanan sensitif yang tidak perlu.

## Panduan pengguna

1. Buka Runner OS dan pilih **Mulai Setup**, atau **Masuk** jika sudah memiliki akun.
2. Isi konteks yang berguna; gunakan **Nanti saja** atau **Belum tahu** untuk jawaban opsional.
3. Tinjau summary lalu selesaikan setup.
4. Gunakan **Hari ini** untuk melihat konteks paling relevan.
5. Catat lari aktual di **Riwayat lari**; metrik yang tidak diketahui boleh dibiarkan kosong.
6. Kelola MJW/latihan berulang dan catat kehadiran faktual di **Jadwal**.
7. Simpan event serta evidence dengan provenance di **Event**.
8. Perbarui konteks dan lihat status Strava di **Profil**.
9. Gunakan **Tanya AI** setelah `GROQ_API_KEY` dikonfigurasi secara privat di Cloudflare; tinjau setiap saran sebelum bertindak. Kegagalan provider tidak mengganggu data lokal.

## Development

Prasyarat: Node.js 20+ dan npm.

```bash
npm install
npm run db:migrate:local
npm test
npm run typecheck
npm run build
npm audit
```

Sandbox preview:

```bash
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000/health
```

## Deployment

- **Platform:** Cloudflare Pages + Hono + D1
- **Branch produksi:** `main`
- **Pages project:** `runner-os`
- **D1 binding:** `DB` → `runner-os-core-production`
- **Workflow:** Cloudflare BYOK melalui token di Deploy panel; tidak menggunakan `wrangler login`.
- Jalankan migration produksi sebelum deployment: `npm run db:migrate:prod`.
- Server-only AI secret: `GROQ_API_KEY`; optional model configuration: `GROQ_MODEL`.
- Default adapter model saat `GROQ_MODEL` tidak diatur: `llama-3.3-70b-versatile`; model dapat diganti dari deployment environment tanpa mengubah domain logic.
- Clerk: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (secret), `CLERK_AUTHORIZED_PARTIES` (mis. `https://runner-os.biz.id,https://runner-os.pages.dev`), opsional `CLERK_JWT_KEY`.
- Optional Strava secrets: `STRAVA_CLIENT_ID` dan `STRAVA_CLIENT_SECRET`.
- Secret dikonfigurasi di luar Git/source code. Genspark tidak membutuhkan atau menerima nilai secret Groq.

## Belum diimplementasikan / blocker eksternal

- **Clerk Google sign-in live:** kode, migrasi, dan secret siap; **BLOCKED** oleh DNS `clerk.runner-os.biz.id` (+4 CNAME lain) yang belum dibuat dan Google OAuth custom credentials di Clerk Dashboard. Lihat Doc 51 §6.

- **Strava live OAuth/sync:** boundary, status, normalizer, import contract, dan deduplikasi sudah tersedia; callback OAuth, revocation provider, serta encrypted token storage diblokir sampai kredensial dan kebijakan penyimpanan token produksi tersedia. Tidak ada sync palsu.
- **Groq live response:** adapter, application service, endpoint, mock tests, dan error normalization tersedia. Cloudflare melaporkan nama secret `GROQ_API_KEY` sudah terkonfigurasi secara encrypted, tetapi nilai secret tidak dibaca atau diubah pada workflow ini. Live provider belum boleh dianggap terverifikasi sampai pemilik menjalankan authenticated safe-prompt test.
- Tidak ada Strava write-back, autonomous AI mutation, event registration, posting, messaging, payment, community management, social network, atau medical inference.
- Browser Safari/WebKit dan mobile device nyata tetap membutuhkan verifikasi manual produksi.

## Rekomendasi berikutnya

1. Verifikasi onboarding dan session matrix pada custom domain di Chromium, Firefox, Safari/WebKit, dan browser mobile.
2. Tentukan penyimpanan token terenkripsi dan OAuth callback policy sebelum mengaktifkan Strava live.
3. Pemilik mengonfigurasi `GROQ_API_KEY` secara manual sebagai Cloudflare Pages secret, lalu menguji live path dengan akun produksi terkontrol tanpa menyalin secret ke source atau chat.
4. Tambahkan data event hanya dari runner atau sumber publik yang dapat ditelusuri; pertahankan status unverified jika tanggal belum pasti.

## Status

- **Clerk identity (2026-11-12):** IMPLEMENTED + TESTED (91/91 tests, 24 tes keamanan Clerk baru); migrasi `0004` diterapkan; production handshake **BLOCKED** (DNS + Google OAuth). Detail di Doc 51.

- **Phase 1–5 code:** implemented dan terverifikasi lokal: 67/67 automated tests lulus, typecheck lulus, production build lulus, tiga migration D1 lulus pada database lokal bersih, dependency audit menemukan 0 vulnerability, API smoke test lulus, dan browser console tidak memiliki error.
- **Strava live:** blocked oleh kredensial/OAuth token-storage prerequisite.
- **Groq live:** unverified/blocked sampai pemilik mengonfigurasi `GROQ_API_KEY` secara manual dan menjalankan live test.
- **Production Phase 5:** deployed via Cloudflare BYOK ke `runner-os`; `/health`, static asset, unauthenticated AI rejection, canonical Pages origin, deployment preview, dan custom domain telah diverifikasi. Live authenticated Groq response belum diuji pada workflow ini.
- **Lint:** tidak ada script lint terpisah; quality gate statis menggunakan TypeScript `tsc --noEmit`.
- **Last updated:** 2026-09-17


## Latest audit and remediation (2026-11-13)

The repository audit and current implementation instructions are recorded in:

- [30 — Full Repository Audit & Remediation Record](docs/30_FULL_REPOSITORY_AUDIT_AND_REMEDIATION_RECORD.md)
- [31 — Master System Prompt & Genspark Execution Prompt](docs/31_RUNNER_OS_MASTER_SYSTEM_PROMPT_AND_GENSPARK_EXECUTION_PROMPT.md)

The audit records the Strava AI exclusion boundary and the outstanding P0 release gates. Verify the current default-branch source and commit history before treating any remediation as merged or deployed. Required follow-up includes a fresh test/typecheck/build/security run, server-side abuse controls, account export/deletion, privacy/terms review, and live Groq/Cloudflare verification. The audit is source inspection, not a production penetration test.

## Phase 6 — Agentic Runner OS (architecture defined; implementation pending)

The next evolution is documented in:

- [Phase 6 Agentic Runner OS Architecture](docs/17_AGENTIC_RUNNER_OS_ARCHITECTURE.md)
- [Phase 6 Agentic Implementation Master Prompt](docs/18_PHASE_6_AGENTIC_IMPLEMENTATION_PROMPT.md)

These documents define a TypeScript-first, Cloudflare-native orchestration architecture, specialist agents, durable workflows, user-controlled memory, approval-gated tools, and a read-only Strava OAuth/sync path. They are target specifications, not evidence that Phase 6 code or live Strava integration has shipped. The last recorded Phase 1–5 verification remains dated 2026-09-17; rerun tests and verify production health before relying on that status.


## Product & Implementation Blueprint (Docs 19–28)

The complete product blueprint now defines the North Star, PRD, MVP/MVW, UX/UI, frontend, backend/database, Strava and AI/MCP integrations, Cloudflare architecture decisions, implementation command center, and execution/testing/release gates.

| Document | Purpose |
|---|---|
| [19 — Product Vision & North Star](docs/19_PRODUCT_VISION_NORTH_STAR.md) | Product direction, principles and success metrics |
| [20 — PRD](docs/20_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Functional/non-functional requirements and user journeys |
| [21 — MVP/MVW](docs/21_MVP_MVW_SCOPE_AND_ACCEPTANCE.md) | Minimum viable scope, valuable workflow and acceptance |
| [22 — UX/UI](docs/22_UX_UI_INFORMATION_ARCHITECTURE.md) | Navigation, screens, interaction states and accessibility |
| [23 — Frontend Contract](docs/23_FRONTEND_IMPLEMENTATION_CONTRACT.md) | Frontend boundaries, API client and UI data contracts |
| [24 — Backend & Database](docs/24_BACKEND_DATABASE_AND_DOMAIN_CONTRACT.md) | Domain, D1, agent tables, state machines and API targets |
| [25 — Integrations](docs/25_INTEGRATIONS_STRAVA_AI_MCP_CONTRACT.md) | Strava OAuth/sync, AI providers, AI Gateway and MCP |
| [26 — Cloudflare Architecture & ADRs](docs/26_CLOUDFLARE_PLATFORM_ARCHITECTURE_AND_ADR.md) | Platform choices, D1/Neon, Workflows/Queues, frameworks and cost gates |
| [27 — Master Implementation Command Center](docs/27_MASTER_IMPLEMENTATION_COMMAND_CENTER.md) | Unified implementation instructions and definition of done |
| [28 — Roadmap & Release Gates](docs/28_EXECUTION_ROADMAP_TESTING_RELEASE_GATES.md) | Phases, QA, security tests and release readiness |
| [29 — Strava OAuth, MCP, Cost & 2026 Policy Decision](docs/29_STRAVA_OAUTH_MCP_COST_AND_2026_POLICY_DECISION.md) | OAuth vs official MCP, subscription/cost, athlete capacity, AI/intermediary restrictions and Runner OS product decision |

**Important:** These are product and implementation specifications. They do not mean the described features are already implemented or production-enabled. The existing source baseline remains the authority. In particular, Strava OAuth/live sync, agentic orchestration, approval inbox, personal memory and additional Cloudflare services remain gated until implemented and verified. The current frontend baseline is static HTML/CSS/JavaScript, not React/Vite; the frontend contract explicitly preserves this unless a measured migration is approved.

## Product evolution — Agentic Running OS as a Service (Doc 37)

The target product model and boundaries for multi-user SaaS, agentic services, usage controls, Clerk Google sign-in, and separate Strava OAuth are defined in:

- [37 — Agentic Running OS as a Service (SaaS) Blueprint](docs/37_AGENTIC_RUNNING_OS_AS_A_SERVICE_SAAS_BLUEPRINT.md)

**Identity boundary:** Clerk is designated for Google sign-in only. Strava OAuth is a separate provider flow and must not be routed through Clerk. Existing email/password authentication must be migrated safely before deprecation.

**Product boundary:** Runner OS remains useful without Strava. Agentic capabilities are bounded, budgeted and approval-gated. The SaaS pricing/tier model is a hypothesis, not published pricing.

**Strava boundary:** Live multi-user OAuth remains blocked until written Strava policy clearance for this exact AI-assisted running SaaS use case. Credentials or athlete consent alone do not clear the gate. Strava API data must remain excluded from Runner OS AI/agent processing under the current policy decision.

## Customer journey & UX improvements (Doc 38)

The first UX audit and improvement pass is documented in [38 — Customer Journey, UX Audit & Improvement Plan](docs/38_CUSTOMER_JOURNEY_UX_AUDIT_AND_IMPROVEMENT_PLAN.md). The audit branch improves the welcome proposition, progressive onboarding, progress feedback, first cockpit actions and Indonesian navigation labels. Remaining work includes Clerk migration, task-oriented agent UX, account lifecycle, complete localization and real-device accessibility QA.

## User access, onboarding & operations (Docs 32–36)

Dokumentasi untuk pengguna eksternal dan operator:

| Document | Purpose |
|---|---|
| [32 — Panduan Pengguna Runner OS](docs/32_PANDUAN_PENGGUNA_RUNNER_OS.md) | Cara membuat akun, setup, mencatat aktivitas, jadwal, event, dan AI |
| [33 — Panduan Akses Pengguna & Public Beta](docs/33_PANDUAN_AKSES_PENGGUNA_DAN_PUBLIC_BETA.md) | Model multi-user, closed beta, public beta, dan release gates |
| [34 — Privacy Notice Draft (ID)](docs/34_PRIVACY_NOTICE_DRAFT_ID.md) | Draft pemberitahuan privasi dengan kategori data dan checklist publikasi |
| [35 — Terms of Service Draft (ID)](docs/35_TERMS_OF_SERVICE_DRAFT_ID.md) | Draft syarat penggunaan dan batasan AI/integrasi |
| [36 — Operations, Support & Incident Runbook](docs/36_OPERATIONS_SUPPORT_AND_INCIDENT_RUNBOOK.md) | Dukungan, insiden keamanan, backup/restore, dan secret handling |

**Public access warning:** docs 34 and 35 are explicitly DRAFT and must not be published as final legal terms. Docs 32–36 do not implement missing account export/deletion, rate limits, or production controls. Public launch remains blocked until the P0 checklist in docs 30 and 33 is verified.

## Genspark full implementation master prompt (Doc 50)\n\nUse [50 — Genspark Master System Prompt: Full Runner OS Implementation](docs/50_GENSPARK_MASTER_SYSTEM_PROMPT_FULL_IMPLEMENTATION.md) as the single paste-ready execution prompt when asking Genspark.ai to audit and implement the remaining product. It explicitly requires direct setup, configuration, implementation, testing and evidence-based progress—not just proposals. It includes a priority Clerk Production runbook for Google sign-in, secure credential handling, identity migration, environment isolation and real production verification. It also consolidates the product direction, repository constraints, Strava policy gate, agentic command-center architecture, SaaS controls, research budget rules and release gates. Genspark must never place secrets in prompts, GitHub, source files or chat, and must distinguish implemented, tested, deployed and production-verified work.\n\n## Personalized Agentic Running OS — Command Center v2 (Docs 39–49)

The unified product direction is **Personalized Agentic Running OS delivered as multi-tenant SaaS**. Agentic OS is the product capability; SaaS is the delivery and business model. The master command center and complete supporting specifications are indexed below.

| Document | Purpose |
|---|---|
| [39 — Master Command Center v2](docs/39_AGENTIC_RUNNING_OS_MASTER_COMMAND_CENTER_V2.md) | Unified product decision, principles, system layers, command loop and execution order |
| [40 — Product Thesis & Requirements](docs/40_PRODUCT_THESIS_POSITIONING_AND_REQUIREMENTS.md) | Category, positioning, target segments, user jobs and success metrics |
| [41 — Personas, Journey & UX](docs/41_PERSONAS_CUSTOMER_JOURNEY_AND_UX_SPEC.md) | First-session journey, command-center UX, states and accessibility |
| [42 — Agent Orchestration](docs/42_AGENTIC_ORCHESTRATION_AND_SPECIALIST_AGENT_ARCHITECTURE.md) | Orchestrator, specialist roles, run state machine and evaluation |
| [43 — Personal Memory & Data](docs/43_PERSONAL_MEMORY_ACTIVITY_DATA_AND_PROVENANCE.md) | Memory controls, activity schema, provenance and AI context policy |
| [44 — Tool Registry & Approvals](docs/44_TOOL_REGISTRY_APPROVALS_AND_EXECUTION_SAFETY.md) | Typed tools, permissions, approvals, execution controls and verification |
| [45 — Cloudflare Runtime](docs/45_CLOUDFLARE_TECHNICAL_ARCHITECTURE_AND_RUNTIME.md) | Cloudflare-first architecture, D1 model, durable execution and identity migration |
| [46 — Security, Privacy & Safety](docs/46_SECURITY_PRIVACY_SAFETY_AND_COMPLIANCE.md) | Tenant security, privacy, running safety, Strava policy and release blockers |
| [47 — SaaS Economics](docs/47_SAAS_PACKAGING_USAGE_METERING_AND_UNIT_ECONOMICS.md) | Candidate packages, usage metering, billing and contribution margin |
| [48 — Research & Actor Register](docs/48_MARKET_RESEARCH_EVIDENCE_AND_ACTOR_REGISTER.md) | Competitor hypotheses, limited review sample, Actor pricing and research protocol |
| [49 — Roadmap & Release Gates](docs/49_EXECUTION_ROADMAP_TEST_STRATEGY_AND_RELEASE_GATES.md) | Phased delivery, test matrix and GO/NO-GO criteria |

**Implementation status:** Docs 39–49 are specifications and decision records, not proof that the described Agentic Core, Clerk migration, approvals, subscription billing or specialist agents have shipped. Existing source and verified deployment state remain authoritative. Do not enable Strava API data in AI/agent context; native/manual activity records remain first-class. Actor discovery/pricing is recorded for research planning; no additional paid Actor run was authorized by this documentation work.
