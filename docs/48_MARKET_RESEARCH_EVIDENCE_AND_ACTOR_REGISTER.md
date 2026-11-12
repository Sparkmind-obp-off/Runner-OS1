# 48 — Market Research Evidence & Actor Register

Last updated: 2026-11-13. Scope: directional desk research, not a market-size study or representative survey.

## Research question
Is there an unmet need for a personal running workspace unifying verified activities, plans, schedule, progress and bounded AI assistance, especially for Indonesian recreational runners?

## Qualitative competitor landscape
- Strava: activity tracking, social network, segments and community.
- Garmin Connect / COROS: device ecosystem, metrics and training context.
- Nike Run Club: guided running, plans and beginner-friendly experience.
- Runna: structured personalized plans and coaching-oriented workflows.
- TrainingPeaks: calendar, training analysis and coach/athlete workflows.
- Runkeeper: activity tracking, goals and training support.
- Coach-led clubs and spreadsheets: human accountability and flexible context.

This is category positioning, not a fully verified feature/pricing benchmark. Verify current feature/pricing per market before external publication.

## Initial Scrape.ly sample
A previous bounded run returned 30 Google Play Indonesia app listing results and 187 Indonesian-language reviews: Runna 37, Nike Run Club 50, Strava 50, ASICS Runkeeper 50; ProRun had zero records matching the selected filter. Small, filtered sample; do not generalize percentages or claim representative sentiment. Previous qualitative synthesis noted GPS/record reliability, login stability, localization, paywalls and integration expectations. Re-code raw reviews before quantifying themes.

## Hypotheses
1. Beginners need an easier first plan and low-pressure logging.
2. Recreational runners value schedule adaptation more than another social feed.
3. Indonesian-first guidance and local event context improve activation.
4. A trustworthy native activity ledger reduces integration dependency.
5. Users will pay for useful agent workflows if costs and limits are transparent.
6. Agentic task completion creates retention beyond conversational AI.

## Research methods
15–20 interviews across beginner, consistency and event-focused runners; 5–8 moderated usability sessions per priority segment; public review coding with date/country/language/rating/version; competitor feature/pricing capture with evidence URL and retrieval date; landing-page smoke test; closed beta cohort measuring activation, W1/W4 retention and workflow success.

## Actor register — discovered, not all executed
| Catalog | Actor | Surfaced pricing | Use |
|---|---|---|---|
| Scrape.ly | querystone/google-play-scraper | USD 1.95/1,000 results + USD 0.005 start | App discovery; cap results |
| Scrape.ly | querystone/google-play-reviews-scraper | USD 0.127/1,000 reviews | Public review sample |
| Apify | apihq/google-play-reviews-scraper | USD 0.08/1,000 reviews | Alternative review collection |
| Apify | neatrat/google-play-store-reviews-scraper | USD 0.15/1,000 reviews | Alternative; validate limits |
| Apify | curious_coder/google-play-scraper | USD 0.30/1,000 results | App discovery/reviews; inspect action schema |

Prices are listing estimates surfaced for FREE tier at discovery time and may change. Confirm live detail page before execution. Actor discovery is not data collection. No paid run is authorized by this document.

## Actor selection policy
Search at least two catalogs; fetch exact Actor details and input schema; compare price model, per-result/start costs, free allowance, rate limits, data scope, maintenance, success rate and output fields; estimate maximum spend; set Actor-native limits and spend caps; run a tiny sample; inspect quality and duplicates; stop if pricing is ambiguous or cap unsupported; record run ID, date, version, inputs, record count, spend and evidence. Do not assume Scrape.ly and Apify Actor names/prices match.

## Source ledger
Google Play listing/review pages are public user-generated data; store collection date and locale. Actor listings are dynamic. Add official competitor product/policy URLs and retrieval date before publishing market claims. Re-check official Strava terms before activating integration.

## Limitations
No verified TAM/SAM/SOM, representative Indonesia runner survey, willingness-to-pay evidence, statistically sound review sentiment model, or direct user tests completed in this pass.
