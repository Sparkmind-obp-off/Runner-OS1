# Runner OS — Strava OAuth 2.0, MCP, Cost & 2026 Policy Decision

**Status:** Decision record / implementation gate  
**Research checked:** 13 November 2026  
**Applies to:** Runner OS product, backend, AI features, integrations and future public launch

## Executive decision

Do not treat Strava OAuth 2.0 and Strava MCP as interchangeable.

- **OAuth 2.0 + Strava API** is the official developer integration for an application that has registered a Strava API app. It can authorize an athlete to connect their own Strava account to that app.
- **Strava MCP** is Strava's own, first-party agent interface for a subscriber's personal use of their own Strava data through AI platforms Strava designates. It is not a public backend API, not a generic MCP server that Runner OS can host, and not an integration layer Runner OS may use to pass multiple users' data into its own AI.
- **Runner OS must not send Strava API data to Groq, OpenAI, Gemini, Workers AI, another LLM, a RAG pipeline, a vector store, or any other AI application.** The current Strava API Policy expressly prohibits using API data in connection with the development, training, evaluation or operation of any AI application, including inference/context-window use. The stated exception is Strava's own MCP.
- Because Runner OS is positioned as an AI-assisted product, a Strava API integration is only worth considering if it has a narrowly scoped, non-AI, owner-only display use case and the team can comply with all current data-use, retention, deletion, privacy and review rules. Otherwise defer it and use Runner OS-native/manual activity records that are not sourced from Strava API.

This decision supersedes any earlier broad assumption that Strava-imported activities can be included in Runner OS AI context selection.

## 1. What is OAuth 2.0 here?

OAuth 2.0 is the authorization protocol, not a paid SDK or a special Strava MCP connection.

The normal athlete flow is:

1. User presses **Connect with Strava** in Runner OS.
2. Runner OS redirects the browser to Strava's official authorization page using the app's Client ID, requested scopes, registered callback URL and a one-time state value.
3. The user signs in to their own Strava account and approves or rejects the requested access.
4. Strava redirects to the registered Runner OS callback with an authorization code and granted scopes.
5. Runner OS validates state and exchanges the code server-to-server using its Client Secret.
6. The server receives the athlete identity and tokens. Tokens must remain server-side and be protected; access tokens are short-lived and refresh tokens must be handled according to Strava's current authentication requirements.
7. User can disconnect/revoke access; Runner OS must stop access and honor deletion requirements.

**The end user should never enter Client ID or Client Secret.** Those identify the developer application and belong to the app owner. The Client Secret must never be exposed in browser JavaScript, public repositories, chat, or client-visible API responses.

## 2. One app or one app per user?

For a normal multi-user OAuth product, the intended pattern is:

- One Runner OS-owned Strava developer application.
- Each Runner OS user authorizes their own personal Strava account using Strava's OAuth consent screen.
- Each authorization/token set is associated with exactly one Runner OS owner.
- Never share API tokens between users, apps, services or unrelated servers.
- Never ask each Runner OS user to register a developer app or paste credentials into Runner OS.

However, one app does **not** mean unrestricted multi-user access. Current Strava capacity and review rules apply (see section 4). The API Policy also imposes strict limits on how data may be used and exposed.

## 3. Is it free?

Separate the protocol, API access and Strava subscription:

| Item | Current position |
|---|---|
| OAuth 2.0 protocol | No separate protocol fee; it is the authorization mechanism |
| Strava API usage | Strava's current FAQ says there is no additional API fee on top of the required subscription |
| Creating a new Standard Tier API app | Requires the app owner/developer to have an active Strava subscription |
| Each connected Runner OS user | The developer FAQ does not say every connected athlete must buy a subscription just to authorize the app; do not claim they must |
| Strava MCP personal access | Available to Strava subscribers for their own data through supported/trusted AI platforms |
| Free trial | No guaranteed free trial was verified. Do not build the plan around a trial or assume one is offered |
| Extended Access Tier | Strava says Extended Access apps do not need the Standard Tier subscription; all Extended Access apps require review and eligibility is not automatic |

**Conclusion:** OAuth 2.0 itself is not a paid product, but creating a new Standard Tier Strava API app is not a fully free/no-payment path because Strava requires the app owner to hold a subscription. API access currently has no separate per-call fee according to Strava's FAQ. Prices and eligibility can change; check the current Strava account pricing and developer dashboard before paying.

## 4. App capacity and review

Current Strava developer guidance describes:

- New apps begin in **Single Player Mode**, with capacity for one athlete (the app owner).
- The owner can self-upgrade to a capacity of 10 in the API settings dashboard without a formal review.
- Above 10 athletes, the app needs Strava review before additional athletes can authorize it.
- The Standard Tier can be approved to grow up to 9,999 athletes.
- Extended Access is intended for higher-capacity commercial developers (10,000+); all Extended Access applications require review.
- Review and increased access are not guaranteed.

Treat the developer dashboard and current official FAQ as authoritative at the moment of registration. Do not promise public multi-user availability before the app has the necessary approval.

## 5. Critical 2026 AI and intermediary restrictions

The current Strava API Policy, effective 1 June 2026, contains restrictions that directly affect Runner OS:

### AI restriction

Strava API data may not be used, directly or indirectly, in connection with development, training, evaluation or operation of any AI application. The policy explicitly includes:
- inference or ingestion into an AI model's context window / working memory;
- RAG and retrieval;
- embeddings and vector stores;
- model evaluation, benchmarking, grounding or fine-tuning;
- derived, aggregated, anonymized or model-output data based on Strava data.

**Therefore, do not include Strava-sourced activities in Runner OS AI prompts, memory, context selection, summaries, coaching, recommendations, analytics or agent tools.** A user's consent does not override the API Policy.

### MCP and intermediary restriction

The policy prohibits:
- operating an MCP server or agent-mediated interface that exposes Strava API materials or Strava data;
- operating an abstraction layer, pass-through proxy, intermediary, integration platform or aggregator that re-exposes Strava API data;
- sharing/multiplexing API tokens across services, apps or end users;
- building an application whose primary purpose is to let third parties access Strava data through the developer's credentials or infrastructure.

Strava's own MCP is the sole authorized first-party agent-mediated interface. Subscribers may use it for personal access to their own data through AI platforms Strava designates. It is not permission for Runner OS to run its own Strava MCP server or to use Strava MCP as a commercial/multi-user backend.

### Data ownership, retention and deletion

- Show a specific athlete's Strava data only to that same athlete in Runner OS.
- Do not publish other users' Strava data in leaderboards, public feeds, shared dashboards or community features.
- The current policy restricts caching to no more than seven days and prohibits persistent indexes/archives outside the expressly permitted operational scope.
- Reflect activity deletions within 48 hours.
- On user revocation/deletion or other specified events, delete the affected Strava data and derived personal data within the policy's stated deadline (generally promptly and no later than 30 days for the specified deletion obligations).
- Respect privacy settings and scopes. Start with the minimum necessary access.
- Do not use Strava data for customer insights, cross-user analytics, advertising targeting, product improvement or aggregated analytics.

These restrictions mean a typical “import all runs, retain forever, analyze with AI, compare users” integration is not compliant with the current policy.

## 6. What is the best Runner OS concept?

### Recommended product decision now

**Do not make Strava OAuth a dependency of the Runner OS MVP or AI experience.**

Use this separation:

1. **Runner OS native activity record:** users can manually record or edit their own running activities in Runner OS. These records are first-party Runner OS data, not obtained from Strava API. AI features may use only data whose source and rights permit that use, subject to Runner OS privacy/consent controls.
2. **Strava personal AI access:** if a user wants conversational analysis of their own Strava data, direct them to Strava's official MCP experience on a supported platform, under Strava's subscriber/personal-use terms. Do not proxy it through Runner OS.
3. **Optional future Strava display-only connection:** reconsider only if there is a genuinely useful, non-AI feature that merely displays the connected athlete's own Strava data, and legal/product review confirms the precise display, storage, cache, deletion and retention design is allowed. Keep it outside every AI context and agent pipeline.
4. **No credential form:** never ask users for Client ID, Client Secret, access token or refresh token.
5. **No scraping or unofficial connector:** do not scrape Strava, use a third-party intermediary that asks users to enter API credentials, or build a custom Strava MCP server.

### UI recommendation

For current MVP:
- Keep Strava status as **Belum tersedia / Tidak terhubung** if the live OAuth feature is not implemented.
- Do not show a fake “Connected” state.
- Do not show an active Connect button until the app registration, allowed capacity, callback, secure token lifecycle and policy-compliant feature boundary have been verified.
- If product discovery is useful, show a neutral explanation: “Catat aktivitas di Runner OS. Untuk akses AI ke data Strava pribadi, gunakan konektor resmi Strava pada platform yang didukung.”

## 7. Runner OS technical guardrails if a display-only OAuth integration is later approved

- Keep Client ID/Secret as Cloudflare Worker secrets; never expose them to the browser.
- Use official OAuth authorization code flow and cryptographically random, single-use, short-lived state bound to the logged-in owner/session.
- Register an HTTPS callback and validate callback origin/state before token exchange.
- Encrypt tokens at rest; store per-owner references and scopes; never log tokens.
- Use minimum scopes. Request additional scopes only for a documented user-facing need.
- Implement refresh-token rotation safely, revocation/deauthorization, webhook verification and idempotent event processing.
- Enforce tenant isolation on every read and write.
- Keep Strava data completely out of AI provider adapters, prompt/context builders, embeddings, analytics and cross-user features.
- Enforce the seven-day cache limit and 48-hour deletion propagation where applicable; do not create indefinite Strava data archives.
- Avoid broad polling; follow Strava's webhook and rate-limit guidance.
- Make the connection status truthful and auditable.
- Re-check the current API Agreement and API Policy before each release; these terms can change.

These are guardrails, not a claim that the existing Runner OS code already implements OAuth or is approved by Strava.

## 8. Existing Runner OS status

The current repository has a Strava activity normalizer/import foundation and external-ID deduplication. It does **not** have verified live OAuth, production token lifecycle, or real account sync. The existing routes that return unavailable/503 must remain truthfully unavailable until the integration is implemented and verified.

Earlier integration planning described passing imported Strava activities into Runner OS AI context. That approach is superseded by the 2026 API Policy and must not be implemented.

## 9. Official references

1. Strava Developers — Getting Started: https://developers.strava.com/docs/getting-started/
2. Strava Developers — Authentication: https://developers.strava.com/docs/authentication/
3. Strava Developers — Rate Limits: https://developers.strava.com/docs/rate-limits/
4. Strava Developers — Webhooks: https://developers.strava.com/docs/webhooks/
5. Strava API Agreement: https://www.strava.com/legal/api
6. Strava API Policy: https://www.strava.com/legal/api_policy
7. Strava API FAQ (Strava Community Hub): https://communityhub.strava.com/developers-knowledge-base-14/strava-api-faq-12906
8. Strava API and MCP FAQ: https://support.strava.com/en-us/articles/15401526-strava-api-and-mcp-faq

**Final decision:** OAuth 2.0 is the correct official authorization flow if Runner OS later needs a permitted Strava API display integration. It is not a free workaround to bypass Strava's subscription, review, data-use or AI restrictions. Strava MCP is the official personal AI route for an athlete's own Strava data, not a Runner OS backend connector. For the current AI-first Runner OS, prioritize native activity records and defer Strava API integration unless a compliant display-only requirement is proven.
