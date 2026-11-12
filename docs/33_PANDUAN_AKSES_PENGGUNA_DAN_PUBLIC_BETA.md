# Runner OS — Panduan Akses Pengguna & Public Beta

**Status:** Dokumen operasional pra-rilis.
**Prinsip:** multi-user dengan akun dan data terisolasi; jangan membuka akses publik sebelum gerbang wajib lulus.

## 1. Tujuan

Dokumen ini mengatur bagaimana pengguna selain pemilik memperoleh akses, mendaftar, mencoba aplikasi, memberi umpan balik, dan memperoleh bantuan.

Aplikasi dirancang untuk banyak akun. Identitas pemilik data harus berasal dari sesi server yang telah diautentikasi. Client tidak boleh menentukan owner ID untuk membaca atau mengubah data personal.

## 2. Peran

**Pengguna:** membuat akun sendiri, mengelola profil/jadwal/aktivitas/event miliknya, dan tidak dapat mengakses akun lain.

**Operator:** mengelola konfigurasi dan operasional. Tidak meminta kata sandi atau token pengguna dan tidak mengakses data personal tanpa kebutuhan sah serta prosedur terdokumentasi.

## 3. Status akses

| Status | Makna |
|---|---|
| Internal | Pemilik dan penguji yang ditunjuk |
| Closed beta | Undangan terbatas dengan batasan yang dijelaskan |
| Public beta | Pendaftaran publik setelah seluruh P0 lulus |
| General availability | Operasi, dukungan, privasi, keamanan, dan pemulihan stabil serta ditinjau |

Status pada saat dokumen ini dibuat: **belum boleh dianggap Public Beta atau General Availability**. Audit 30 mencatat release gate P0 yang belum diverifikasi.

## 4. Checklist sebelum mengundang pengguna eksternal

Semua item wajib PASS dengan bukti tersimpan.

### Keamanan dan isolasi
- [ ] Pengguna A tidak dapat membaca, mengubah, mengarsipkan, atau menghapus data pengguna B.
- [ ] Uji lintas-owner mencakup runs, activities, profile, recurring activities, occurrences, events, dan event evidence.
- [ ] Registrasi, login, dan endpoint AI memiliki rate limit server-side.
- [ ] Session expiry, logout, dan revocation diuji.
- [ ] Cookie, password, token, dan API key tidak muncul pada log, bundle browser, atau respons.
- [ ] Input, ukuran request, dan output provider dibatasi.
- [ ] Error tidak membocorkan detail internal atau data akun.

### Privasi dan tata kelola
- [ ] Privacy Notice final ditinjau dan dipublikasikan.
- [ ] Terms of Service final ditinjau dan dipublikasikan.
- [ ] Kontak operator/privasi dan kanal keamanan aktif.
- [ ] Retensi, backup, export, account deletion, dan session revocation memiliki prosedur yang dapat dijalankan.
- [ ] Disclosure AI dijelaskan sebelum pengguna mengirim prompt.
- [ ] Permintaan akses/koreksi/penghapusan diuji.

### Operasi
- [ ] Build, typecheck, test, dependency audit, dan migration bersih lulus.
- [ ] Cloudflare production binding dan secret diverifikasi tanpa menampilkan nilainya.
- [ ] D1 backup dan restore pernah diuji.
- [ ] Monitoring error, kapasitas, dan biaya tersedia.
- [ ] Dukungan pengguna diuji.
- [ ] Smoke test produksi dan browser mobile selesai.
- [ ] Rollback plan tersedia dan disetujui pemilik.

### Produk
- [ ] Onboarding, empty state, error state, dan logout mudah dipahami.
- [ ] Pengguna mengetahui metrik boleh kosong.
- [ ] Batasan AI dipahami.
- [ ] Fitur Strava yang belum tersedia tidak ditampilkan aktif.
- [ ] Akun baru tidak melihat data contoh milik pemilik.

Jika satu gerbang P0 gagal atau belum memiliki bukti, tetap pada Internal/Closed Beta.

## 5. Prosedur closed beta

1. Operator memilih peserta dan menjelaskan tujuan, durasi, data, batasan, dan cara berhenti.
2. Setiap peserta membuat akun sendiri.
3. Peserta tidak memakai akun pemilik.
4. Gunakan data uji atau data yang memang dimiliki peserta.
5. Catat bug dengan ID, waktu, langkah reproduksi, dampak, dan status.
6. Jangan mengirim dump database atau kredensial melalui chat/email.
7. Jangan menjanjikan penghapusan instan sebelum prosedur tersedia dan diuji.

## 6. Prosedur public beta

Public beta baru dimulai setelah semua checklist P0 lulus. Operator kemudian mengumumkan URL, status beta, Privacy Notice, Terms, panduan pengguna, kanal dukungan, fitur yang tersedia, batas AI, kuota, dan kebijakan fair use. Pendaftaran harus dapat dihentikan sementara jika kapasitas atau keamanan terancam.

## 7. Klaim yang boleh dan tidak boleh dipakai

Boleh:
- “Runner OS sedang menjalani uji coba terbatas.”
- “Setiap pengguna memiliki akun dan ruang data sendiri.”
- “Fitur AI bergantung pada konfigurasi layanan.”
- “Koneksi Strava belum tersedia.”

Jangan:
- “Data dijamin 100% aman.”
- “Semua fitur sudah aktif” jika belum diuji.
- “Strava multi-user sudah live” sebelum disetujui, diimplementasikan, dan diuji.
- Menjanjikan ekspor, penghapusan instan, SLA, uptime, atau dukungan 24/7 sebelum tersedia.

## 8. Model komersial

Harga, paket, kuota, SLA, refund, dan langganan belum disahkan. Jangan memungut pembayaran atau mengiklankan paket berbayar sampai fitur yang dijual tersedia, biaya dihitung, terms/refund ditinjau, checkout/webhook diuji end-to-end, dan hak pengguna dijelaskan.

## 9. Bukti rilis

Catat release version, commit SHA, waktu deployment/environment, hasil quality gates, migration, hasil isolasi akun A/B, status backup/restore, URL dokumen privasi/terms, persetujuan pemilik, known issues, dan rollback trigger.

## 10. Referensi

- docs/30_FULL_REPOSITORY_AUDIT_AND_REMEDIATION_RECORD.md
- docs/32_PANDUAN_PENGGUNA_RUNNER_OS.md
- docs/34_PRIVACY_NOTICE_DRAFT_ID.md
- docs/35_TERMS_OF_SERVICE_DRAFT_ID.md
- docs/36_OPERATIONS_SUPPORT_AND_INCIDENT_RUNBOOK.md

Dokumen ini bukan bukti bahwa checklist sudah lulus.
