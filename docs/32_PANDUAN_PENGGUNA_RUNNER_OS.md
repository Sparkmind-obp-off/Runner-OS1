# Runner OS — Panduan Pengguna

**Status:** Panduan untuk build yang sedang diuji. Bukan pernyataan bahwa aplikasi sudah dibuka untuk publik.
**Alamat produk yang tercatat:** https://runner-os.biz.id

## 1. Apa itu Runner OS?

Runner OS adalah ruang pribadi untuk mengatur rutinitas lari, jadwal, catatan aktivitas, event, dan persiapan. Informasi yang belum diketahui harus tetap ditandai belum diketahui.

Runner OS bukan pengganti dokter, pelatih profesional, layanan timing race, atau platform pencatat aktivitas real-time.

## 2. Akun pribadi

Setiap pengguna harus membuat akun sendiri. Jangan memakai akun pemilik atau berbagi akun dengan orang lain.

- Satu email untuk satu akun.
- Gunakan kata sandi unik.
- Jangan membagikan kata sandi, cookie, atau sesi login.
- Masukkan hanya informasi yang diperlukan.
- Profil, jadwal, aktivitas, dan event harus tetap terpisah per akun.

Akses publik hanya boleh diumumkan setelah seluruh gerbang keamanan, privasi, dan operasional pada dokumen 30 dan 33 lulus.

## 3. Membuat akun

Jika operator telah membuka pendaftaran:

1. Buka https://runner-os.biz.id.
2. Pilih **Mulai Setup**.
3. Pilih pembuatan akun.
4. Isi nama panggilan, email, dan kata sandi.
5. Kirim formulir satu kali dan tunggu konfirmasi.
6. Lanjutkan ke setup profil.

Jika pendaftaran belum tersedia atau muncul error, jangan mencoba berulang kali. Hubungi kanal dukungan resmi yang diumumkan operator.

## 4. Setup profil

Isi informasi yang membantu pengalaman lari: nama panggilan, area lari, hari/waktu lari, jarak umum, tujuan, jenis event, dan preferensi lari sendiri/bersama.

Pertanyaan opsional boleh dilewati. Jangan mengisi tebakan seolah-olah fakta.

## 5. Halaman Hari ini

Halaman utama dapat menampilkan jadwal terdekat, aktivitas terakhir, event relevan, dan pintasan ke fitur utama. Ringkasan bergantung pada data yang kamu masukkan. Data kosong bukan berarti kamu tidak pernah berlari.

## 6. Mencatat aktivitas

1. Buka Riwayat lari atau Aktivitas.
2. Tambahkan aktivitas.
3. Isi tanggal/waktu dan metrik yang benar-benar diketahui.
4. Jarak, durasi, pace, elevasi, usaha, dan perasaan boleh kosong jika tidak diketahui.
5. Simpan dan periksa kembali catatan.

Catatan manual adalah sumber aktivitas utama pada build ini.

## 7. Jadwal dan rutinitas

Gunakan Jadwal untuk aktivitas berulang seperti latihan, komunitas, coaching, atau persiapan event.

Status harus mencerminkan kejadian sebenarnya:
- Direncanakan: belum terjadi.
- Hadir: benar-benar diikuti.
- Dilewati: tidak diikuti.
- Belum diketahui: belum ada konfirmasi.

Jadwal berulang tidak otomatis membuktikan kehadiran.

## 8. Event lari

Simpan event beserta sumber informasinya. Periksa tanggal, lokasi, penyelenggara, kategori, biaya, dan tautan pendaftaran dari sumber resmi. Label Belum terverifikasi berarti informasi belum cukup kuat untuk dianggap fakta. Runner OS tidak menjamin slot atau keabsahan penyelenggara.

## 9. Tanya AI

Jika AI tersedia:
- Tanyakan hal yang berkaitan dengan catatan dan rutinitasmu.
- Periksa asumsi dan informasi yang belum diketahui.
- Perlakukan jawaban sebagai bantuan, bukan instruksi medis atau jaminan hasil.
- Tinjau saran sebelum menjadikannya rencana.
- AI tidak melakukan pendaftaran, pembayaran, posting, pesan, atau perubahan data secara otomatis.

Ketersediaan AI bergantung pada konfigurasi layanan. Jika AI tidak tersedia, pencatatan dan jadwal tetap menjadi fungsi inti.

**Batasan Strava:** koneksi Strava belum tersedia pada build saat ini. Jangan memasukkan Client ID, Client Secret, access token, atau refresh token ke formulir maupun chat. Data Strava API tidak digunakan oleh fitur AI Runner OS.

## 10. Privasi dan keamanan

- Keluar dari akun jika memakai perangkat bersama.
- Jangan membagikan screenshot yang memuat data pribadi tanpa memeriksanya.
- Jangan mengirim kata sandi, cookie, token, atau kode rahasia kepada dukungan.
- Gunakan perangkat dan browser yang diperbarui.

Fitur ekspor akun, penghapusan akun mandiri, dan kontrol retensi belum dinyatakan tersedia. Jangan menganggap fitur tersebut sudah ada sebelum operator mengumumkan implementasi dan prosedurnya.

## 11. Melaporkan masalah

Sertakan halaman/fitur, waktu kejadian dan zona waktu, langkah reproduksi, pesan error, serta browser/perangkat secara umum. Jangan sertakan kata sandi, token, cookie, atau data pelari lain.

Kanal dukungan resmi harus diumumkan operator sebelum pendaftaran publik dibuka.

## 12. Status fitur yang diketahui

| Fitur | Status |
|---|---|
| Registrasi dan login email/kata sandi | Implementasi tersedia; kesiapan publik perlu verifikasi |
| Profil dan onboarding | Implementasi tersedia |
| Home, jadwal, aktivitas, event | Implementasi tersedia |
| AI provider server-side | Adapter tersedia; respons produksi perlu verifikasi |
| Strava OAuth multi-user | Belum tersedia; ditahan untuk peninjauan kebijakan |
| Ekspor dan penghapusan akun mandiri | Belum diverifikasi/diimplementasikan |
| Dukungan publik dan SLA | Belum ditetapkan |

Dokumentasi bukan bukti bahwa build tertentu sudah deployed. Operator harus menyebut versi/commit dan status layanan aktual saat mengundang pengguna.
