# Runner OS

Runner OS adalah **Personal Running Operating System** privat yang membantu pelari memahami jadwal, rutinitas, riwayat lari, event relevan, persiapan, dan konteks personal tanpa mengubah data yang belum terkonfirmasi menjadi fakta.

## Fitur yang sudah selesai

### Fondasi Phase 1–3

- Registrasi/login email dan password dengan PBKDF2 100.000 iterasi.
- Sesi opaque 30 hari di server, cookie host-only `HttpOnly`, `SameSite=Strict`, dan `Secure` pada HTTPS.
- Owner isolation untuk semua data personal.
- Runner Core: Run CRUD, lifecycle, next action, progress, blocker, due time, daily focus, tag, pencarian, filter, dan riwayat append-oriented.
- Security headers, session bootstrap dari server, logout, dan penanganan sesi kedaluwarsa.

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
- Tanya AI server-side dengan provider adapter Grok dan context selection minimum-relevant; tidak ada panggilan provider dari browser.
- UI responsif untuk Home, aktivitas, jadwal, event, profil, integrasi, Tanya AI, serta Runner Core lama.

## URL

- **Local preview:** `http://localhost:3000`
- **Health:** `GET /health`
- **Production custom domain:** https://runner-os.biz.id
- **Canonical Pages origin:** https://runner-os.pages.dev
- **GitHub:** https://github.com/Sparkmind-obp-off/Runner-OS1

URL produksi di atas adalah target deployment yang sudah ada. Status verifikasi deployment Phase 4 dicatat setelah deployment BYOK selesai.

## API

Respons sukses memakai `{ "data": ... }`. Respons error memakai `{ "error": { "code", "message", "details?" } }`. Cross-owner access gagal tertutup sebagai `NOT_FOUND`.

### Authentication

- `POST /api/auth/register` — `{ email, displayName, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

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
- `POST /api/ai/ask` — `{ question }`

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
9. Gunakan **Tanya AI** ketika Grok production secret tersedia; kegagalan provider tidak mengganggu data lokal.

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
- Optional server secrets: `GROK_API_KEY`, `GROK_MODEL`, `STRAVA_CLIENT_ID`, dan `STRAVA_CLIENT_SECRET`.
- Secret tidak boleh disimpan dalam Git atau browser.

## Belum diimplementasikan / blocker eksternal

- **Strava live OAuth/sync:** boundary, status, normalizer, import contract, dan deduplikasi sudah tersedia; callback OAuth, revocation provider, serta encrypted token storage diblokir sampai kredensial dan kebijakan penyimpanan token produksi tersedia. Tidak ada sync palsu.
- **Grok live response:** provider adapter dan endpoint tersedia; tanpa `GROK_API_KEY`, API mengembalikan `AI_PROVIDER_UNAVAILABLE` secara jujur.
- Tidak ada Strava write-back, autonomous AI mutation, event registration, posting, messaging, payment, community management, social network, atau medical inference.
- Browser Safari/WebKit dan mobile device nyata tetap membutuhkan verifikasi manual produksi.

## Rekomendasi berikutnya

1. Verifikasi onboarding dan session matrix pada custom domain di Chromium, Firefox, Safari/WebKit, dan browser mobile.
2. Tentukan penyimpanan token terenkripsi dan OAuth callback policy sebelum mengaktifkan Strava live.
3. Konfigurasi Grok sebagai Cloudflare Pages secret lalu uji context minimization dengan akun produksi terkontrol.
4. Tambahkan data event hanya dari runner atau sumber publik yang dapat ditelusuri; pertahankan status unverified jika tanggal belum pasti.

## Status

- **Phase 4 code:** implemented dan terverifikasi lokal melalui automated tests, typecheck, build, local D1 migration, API smoke test, dan browser console check.
- **Strava live:** blocked oleh kredensial/OAuth token-storage prerequisite.
- **Grok live:** unverified/blocked tanpa production secret.
- **Production Phase 4:** menunggu migration dan deployment BYOK pada akhir workflow ini.
- **Last updated:** 2026-09-17
