# Pemberitahuan Privasi Runner OS

**STATUS: DRAFT — JANGAN DIPUBLIKASIKAN SEBAGAI KEBIJAKAN FINAL SEBELUM IDENTITAS OPERATOR, KONTAK, RETENSI, PROSES PENGHAPUSAN, DAN DASAR PEMROSESAN DITINJAU.**

Versi: Draft 0.1  
Tanggal efektif: Belum ditetapkan  
Pengendali/operator data: [ISI NAMA OPERATOR YANG BENAR]  
Alamat/kontak privasi: [ISI KONTAK RESMI]  
Domain: https://runner-os.biz.id

## 1. Ringkasan

Runner OS membantu pengguna mengelola profil lari, jadwal, aktivitas, event, dan bantuan AI. Draft ini menjelaskan kategori data, tujuan, penyimpanan, pembagian, keamanan, dan pilihan pengguna. Ini belum merupakan pemberitahuan hukum final.

## 2. Kategori data

Berdasarkan struktur aplikasi yang ditinjau, data dapat meliputi:

- **Akun:** email, nama tampilan, hash kata sandi, salt, ID internal, dan waktu pembuatan.
- **Sesi:** hash token sesi, waktu pembuatan, dan waktu kedaluwarsa. Token mentah tidak boleh dicatat ke log.
- **Profil lari:** nama panggilan, area lari, hari/waktu, jarak umum, tujuan, jenis event, preferensi lari bersama, komunitas, dan catatan.
- **Jadwal:** aktivitas berulang, waktu, lokasi, komunitas, target jarak, catatan, dan status kehadiran.
- **Aktivitas:** waktu, durasi, jarak, pace, elevasi, usaha, perasaan, sumber, dan catatan. Nilai yang tidak diketahui dapat kosong.
- **Event:** nama, edisi/tahun, tanggal, lokasi, penyelenggara, kategori, URL pendaftaran, status verifikasi, niat partisipasi, dan bukti sumber.
- **AI:** pertanyaan pengguna dan konteks personal terpilih untuk menjawab. Retensi prompt/jawaban harus dikonfirmasi sebelum rilis.
- **Teknis:** informasi minimum yang diproses platform hosting untuk keamanan, operasi, dan diagnosis. Jenis log, masa simpan, dan akses operator harus dikonfirmasi.

Jangan menambahkan kategori data sensitif tanpa kebutuhan, pemberitahuan, dan dasar pemrosesan yang sesuai.

## 3. Tujuan pemrosesan

Data dapat diproses untuk membuat dan mengamankan akun; menyajikan profil, jadwal, aktivitas, dan event; menjalankan fitur yang diminta; menghasilkan jawaban AI jika diaktifkan; menjaga keamanan; dan memenuhi kewajiban hukum. Tujuan final dan dasar pemrosesan setiap kategori harus ditinjau sebelum publikasi.

## 4. Pemrosesan AI

Jika AI diaktifkan, permintaan dikirim dari server ke penyedia model yang dikonfigurasi. Hanya konteks yang dipilih untuk tujuan permintaan yang boleh disertakan. Kredensial provider disimpan server-side. Jawaban AI dapat salah atau tidak lengkap dan bukan diagnosis atau nasihat medis.

Nama penyedia AI, negara pemrosesan, subprosesor, retensi provider, dan pengaturan penggunaan data provider harus dilengkapi setelah konfigurasi produksi diverifikasi.

**Batas Strava:** integrasi Strava API tidak aktif pada build saat ini. Data Strava API tidak boleh masuk prompt, konteks, memori AI, RAG, embeddings, rekomendasi, evaluasi model, atau analitik AI.

## 5. Penyedia layanan

Data dapat diproses oleh penyedia infrastruktur yang diperlukan untuk hosting/database dan penyedia AI jika fitur AI digunakan. Operator harus mencantumkan nama entitas, fungsi, lokasi pemrosesan, syarat, serta transfer lintas negara yang relevan sebelum kebijakan final diterbitkan.

Runner OS tidak boleh menjual data pribadi pengguna kepada pengiklan. Jangan membuat klaim tentang tidak adanya akses operator/subprosesor tanpa verifikasi teknis dan kontraktual.

## 6. Keamanan

Aplikasi dirancang menggunakan akun terpisah dan akses data berdasarkan owner. Kontrol yang harus dipelihara dan diuji mencakup hash kata sandi/token sesi, cookie HttpOnly/Secure/SameSite, otorisasi server-side, HTTPS, secret server-side, validasi input, rate limiting, logging teredaksi, backup, dan respons insiden.

Tidak ada sistem yang dapat menjanjikan keamanan absolut. Klaim publik harus didukung bukti.

## 7. Retensi

Masa simpan final belum ditetapkan. Operator wajib menetapkan retensi untuk data akun; aktivitas/jadwal/event; prompt/jawaban AI; log teknis; backup D1; dan catatan keamanan/insiden. Jangan menyatakan data langsung terhapus jika backup atau log masih menyimpan salinan.

## 8. Hak dan permintaan pengguna

Pengguna dapat menghubungi kanal privasi untuk menanyakan, memperbaiki, memperoleh salinan, atau meminta penghapusan data sesuai hukum dan kemampuan sistem.

**Status implementasi:** fitur self-service export dan account deletion belum diverifikasi. Operator harus menyediakan proses aman dan menguji penghapusan seluruh tabel terkait, sesi, backup sesuai jadwal, dan subprosesor sebelum menerima pengguna publik.

Kontak privasi: [ISI EMAIL/KANAL RESMI]  
Target waktu respons: [TETAPKAN SETELAH KAPASITAS OPERASIONAL DIKETAHUI]

## 9. Anak dan pengguna di bawah umur

[OPERATOR HARUS MENETAPKAN BATAS USIA, PERSETUJUAN ORANG TUA/WALI, DAN PROSEDUR SESUAI HUKUM. JANGAN MEMBUKA AKSES BAGI PENGGUNA DI BAWAH UMUR SEBELUM KEBIJAKAN DITINJAU.]

## 10. Perubahan kebijakan

Versi final harus menampilkan tanggal berlaku dan ringkasan perubahan. Perubahan material diberitahukan sesuai hukum.

## 11. Checklist publikasi

- [ ] Identitas operator dan kontak benar.
- [ ] Data map dan subprosesor diverifikasi.
- [ ] Lokasi pemrosesan dan transfer lintas negara ditinjau.
- [ ] Dasar pemrosesan dan consent flow ditinjau.
- [ ] Retensi database, AI, log, dan backup ditetapkan.
- [ ] Export, koreksi, deletion diuji.
- [ ] Batas usia ditetapkan.
- [ ] Disclosure AI dan Strava sesuai implementasi.
- [ ] Ditinjau penasihat hukum/privasi.
- [ ] Disetujui operator dan dipublikasikan.

**Jangan hapus label DRAFT sebelum semua checklist selesai.**
