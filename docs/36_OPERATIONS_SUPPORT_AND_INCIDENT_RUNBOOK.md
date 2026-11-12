# Runner OS — Operations, Support & Incident Runbook

**Status:** Draft operasional. Sesuaikan dengan Cloudflare account dan konfigurasi produksi yang benar sebelum dipakai.

## 1. Pemilik dan kontak

- Service owner: [TETAPKAN]
- Backup operator: [TETAPKAN]
- Security contact: [PUBLIKASIKAN KONTAK]
- Privacy contact: [PUBLIKASIKAN KONTAK]
- User support: [PUBLIKASIKAN KANAL]

Jangan memasukkan nomor pribadi, account ID, atau token rahasia ke dokumen publik.

## 2. Environment yang tercatat

Repository mendokumentasikan:
- Pages project: runner-os
- D1 binding: DB
- D1 database label: runner-os-core-production
- Production domain: https://runner-os.biz.id
- Canonical Pages origin: https://runner-os.pages.dev

Nama tersebut harus diverifikasi kembali di Cloudflare sebelum tindakan operasional. Dokumentasi bukan bukti konfigurasi akun saat ini.

## 3. Pemeriksaan rutin sebelum rilis

1. Verifikasi branch dan commit SHA.
2. Jalankan dependency install, test, typecheck, build, dan dependency audit.
3. Terapkan migration pada D1 lokal bersih dan periksa hasil.
4. Uji isolasi owner menggunakan dua akun terpisah.
5. Uji error dan respons aman provider AI.
6. Pastikan secret dan data personal tidak ada di bundle browser/log.
7. Verifikasi production binding tanpa mencetak nilai secret.
8. Pastikan backup dan rollback siap.
9. Dapatkan persetujuan pemilik sebelum migration/deploy produksi.

Setelah rilis, cek /health, registrasi/login/logout, profil, jadwal, aktivitas, event, AI state, Strava unavailable state, error rate, dan biaya provider. Catat SHA deployment dan hasil pemeriksaan.

## 4. Intake dukungan pengguna

Minta fitur/halaman, waktu dan zona waktu, langkah reproduksi, teks error, browser, dan kategori perangkat.

Jangan pernah meminta password, cookie sesi, API key, token Strava, dump database, atau data aktivitas pengguna lain. Minta pengguna menyamarkan data pribadi di screenshot.

## 5. Tingkat insiden

| Severity | Contoh | Tindakan awal |
|---|---|---|
| SEV-1 | Kebocoran lintas akun, credential leak, kompromi layanan | Hentikan akses/fitur terdampak dan hubungi owner/security |
| SEV-2 | Login tidak tersedia, data rusak, gangguan AI luas | Triage, mitigasi, komunikasikan status |
| SEV-3 | Bug satu pengguna dengan workaround | Catat, reproduksi, prioritaskan |
| SEV-4 | Masalah kosmetik/dokumentasi | Masukkan backlog |

## 6. Respons insiden keamanan

1. Catat waktu, gejala, environment, dan pelapor.
2. Batasi dampak: nonaktifkan fitur/endpoint atau pendaftaran bila perlu.
3. Jangan hapus bukti/log saat triage awal.
4. Rotasi credential melalui dashboard provider jika diduga bocor.
5. Periksa akses dan tentukan akun/data terdampak.
6. Tinjau kewajiban notifikasi hukum dengan penasihat kompeten.
7. Beri tahu pengguna terdampak jika diwajibkan.
8. Pulihkan dari kondisi tepercaya setelah akar masalah ditangani.
9. Tambahkan regression test dan catatan pembelajaran.
10. Jangan menaruh secret atau data personal berlebihan di issue/commit.

## 7. Backup dan restore

Sebelum rilis publik, tetapkan frekuensi backup, owner, enkripsi, akses, retensi, operator restore, persetujuan, RPO, RTO, dan jadwal restore test.

Backup belum terverifikasi sampai restore test berhasil. Jangan menjalankan migration destruktif atau restore produksi tanpa persetujuan pemilik dan rollback plan yang ditinjau.

## 8. Secret management

Simpan credential hanya di encrypted secrets Cloudflare atau vault provider. Jangan menaruh nilai secret di Git, issue, chat, email, atau browser. Rotasi jika ada dugaan kebocoran. Catat nama secret, environment, owner, dan tanggal rotasi saja.

## 9. Kill switch

Operator harus mengetahui cara menghentikan pendaftaran baru, AI requests, integrasi terdampak, atau traffic saat insiden. Jangan mengklaim kill switch tersedia sebelum diimplementasikan dan diuji. Jika tidak ada switch aplikasi, dokumentasikan mitigasi Cloudflare yang sudah diverifikasi.

## 10. Template komunikasi

Status Runner OS: [Investigating / Identified / Monitoring / Resolved]  
Waktu mulai: [tanggal/jam/zona waktu]  
Dampak: [fitur/pengguna terdampak yang terkonfirmasi]  
Yang dapat dilakukan pengguna: [workaround aman]  
Pembaruan berikutnya: [waktu/kanal]

Jangan berspekulasi tentang penyebab, pengguna terdampak, atau waktu pemulihan.

## 11. Batasan yang diketahui

- Self-service account export/deletion belum diverifikasi pada source baseline.
- Bukti production restore drill belum tersedia pada audit.
- Production rate limiting untuk registrasi/login/AI belum diverifikasi.
- Strava OAuth, token lifecycle, webhook, dan live sync belum diimplementasikan.
- Live authenticated Groq response belum diverifikasi pada audit terbaru.
- Kontak dukungan dan privasi publik belum diberikan.

Ini adalah release blockers/tugas operator, bukan sekadar penyempurnaan dokumentasi.
