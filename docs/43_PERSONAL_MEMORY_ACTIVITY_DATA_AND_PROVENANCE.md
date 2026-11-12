# 43 — Personal Memory, Activity Data & Provenance

## Data ownership
Authenticated user owns their personal workspace data subject to applicable law and published terms. Tenant/user IDs derive from verified server session, never client-supplied ownership fields.

## Memory layers
1. Structured profile: goals, preferred days, units, experience and user-entered constraints.
2. Domain records: activities, plans, schedule occurrences, events and progress.
3. User-approved preferences: communication style and coaching preferences.
4. Agent run summaries: minimal operational summaries only when useful and retention-approved.
5. Raw conversations: off by default for durable memory; store only with clear purpose, consent, retention and deletion rules.

## Memory controls
User can inspect, edit, disable, export and delete eligible memory. Every item records source, timestamps, confidence/status, purpose and retention. Never silently convert inference into fact. Do not infer sensitive traits or store medical details by default.

## Activity record contract
Minimum fields: id, owner_id, activity_type, started_at, timezone, duration_seconds nullable, distance_meters nullable, elevation_gain_meters nullable, pace_seconds_per_km nullable, source, source_record_id nullable, verification_status, created_at, updated_at, notes nullable.

Sources: manual, runner_os, device_import, provider_import. Store raw metadata only when necessary and permitted. Deduplication keys are scoped to owner/provider. Preserve original values and provenance when normalizing.

## Provenance states
user_entered, provider_reported, system_calculated, model_estimated, externally_verified, unverified. Model estimates never overwrite source facts. Derived metrics record formula, input IDs and version.

## AI context policy
Context builder is purpose-limited, tenant-scoped, field-allowlisted and size-bounded. Exclude Strava API data from all AI/agent context under the current policy decision. Do not use Strava API data for inference, RAG, embeddings, summaries, recommendations, evaluation or model operations. Do not expose API data through MCP/proxy/aggregation. Native/manual data remains the preferred AI context where rights and consent allow.

## Retention and deletion
Define retention by category. Account deletion revokes sessions, stops active jobs, removes/anonymizes personal records according to legal obligations, removes derived memory and schedules backup deletion where supported. Export is machine-readable and includes provenance. Do not claim deletion complete until every relevant store and processor is covered.

## Data quality
Reject impossible values, preserve nulls, normalize units, validate timezone, prevent duplicate writes and keep correction history for consequential edits. Progress charts disclose gaps and incompatible measurement sources.
