# Panduan membuat episode Dark Tales

Semua perintah dijalankan dari folder utama repo. Di PowerShell yang memblokir skrip, ganti `npm` dengan `npm.cmd`.

## Cara tercepat: minta Claude
Cukup tulis, misalnya: *"Buat episode Dark Tales baru tentang <topik>"*. Skill `dark-tales-episode` akan membimbing Claude lewat seluruh alurnya (pilih cerita, cek fakta, naskah, shot, suara, pemeriksaan, render). Kamu hanya perlu menyetujui cerita, naskah, dan pemakaian kredit ElevenLabs.

## Langkah manual
1. **Cerita + fakta.** Pilih cerita nyata dengan twist di akhir. Catat tiap klaim beserta sumbernya (lihat `docs/writing-guide.md`).
2. **Buat kerangka episode**
   ```
   npm run ep -- new nama-episode "Judul Episode"
   ```
   Ini membuat `public/episodes/nama-episode/episode.json` dan mendaftarkannya otomatis.
3. **Isi `episode.json`:** teks narasi (`vo`) per scene, daftar `shots` (visual), dan beberapa `sfx`. Waktu visual dipasang ke **kata yang diucapkan** (misalnya `"@secret"`), bukan detik, jadi aman kalau suara direkam ulang. Contoh lengkap: `public/episodes/tarrare/episode.json`. Daftar jenis shot: `docs/episode-format.md`.
4. **Suara (ElevenLabs).** Salin `.env.example` menjadi `.env` dan isi `ELEVENLABS_API_KEY`. Lalu:
   ```
   npm run ep -- voice nama-episode
   ```
   Ini memakai kredit ElevenLabs. File yang sudah ada dilewati (pakai `--force` untuk membuat ulang).
5. **Periksa struktur (tanpa audio atau kunci API):**
   ```
   npm run ep -- lint nama-episode
   ```
   Lalu **periksa penuh** setelah suara terekam:
   ```
   npm run ep -- check nama-episode
   ```
   Pemeriksa menangkap cue kata yang salah, shot yang terlalu cepat, SFX yang bertumpuk, durasi berlebih, dan sumber fakta yang belum diverifikasi. Perbaiki semua `ERROR`; baca semua `warn`.
6. **Lihat hasilnya:** `npm run dev`, lalu buka composition `DarkTales-nama-episode`.
7. **Render:**
   ```
   npm run ep -- render nama-episode
   ```
   Hasil: `out/nama-episode/nama-episode.mp4` dan `out/nama-episode/publish.txt` (judul, deskripsi, hashtag, daftar sumber).

## Mengubah branding
Semua gaya ada di satu file: `src/brand/brand.json` (nama channel, watermark, warna, font, ukuran subtitle, teks ajakan Follow, volume musik dan SFX, suara ElevenLabs). Ubah di sana, dan semua episode berikutnya ikut berubah.

## Musik latar
Bawaan: `public/audio/bgm-local.wav` (musik orisinal buatan kode). Untuk musik yang lebih kaya, jalankan `node scripts/generate-audio.mjs bgm` (ElevenLabs Music), lalu ubah `audio.bgmFile` di `brand.json` menjadi `"audio/bgm.mp3"`.

## Aturan emas
- Fakta dulu: jangan tandai sumber `verified: true` kalau belum benar-benar dibaca.
- SFX jarang dan lembut; suara narator yang utama.
- Tanpa foto, klip, atau musik orang lain kecuali berlisensi.
