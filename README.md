# Leksa — Flashcard Bahasa Inggris Berbasis Gamifikasi

Aplikasi web responsif untuk menghafal kosakata bahasa Inggris secara efektif, menggunakan sistem **Spaced Repetition (Leitner)** dan **Active Recall** sebagai metode utama pembelajaran.

🔗 **Demo live:** [leksa-one.vercel.app](https://leksa-one.vercel.app)

---

## Fitur Utama

### Flashcard & Kosakata

- **Tambah kata** via Generate AI (Gemini 2.5 Flash) atau input manual
- Kartu otomatis dilengkapi: terjemahan, kelas kata, contoh kalimat EN+ID, catatan grammar
- Dukungan kata tunggal maupun frasa (_phrasal verb_, idiom, dll)
- Untuk kata kerja: bentuk V1 · V2 · V3 otomatis ditampilkan
- Untuk kata benda: bentuk tunggal · jamak otomatis ditampilkan
- Lemmatization otomatis (mis. "running" → disimpan sebagai "Run")
- Kapitalisasi otomatis di awal kata
- **Pencegahan duplikat** — sistem menolak penambahan kata yang sudah ada
- Pelafalan via Web Speech API (bawaan browser, tanpa API key)

### Sistem Belajar

- **Mulai Belajar** — flashcard bolak-balik, navigasi Sebelumnya/Selanjutnya; murni untuk meninjau, tidak memengaruhi progres Leitner
- **Tinjauan Bebas** — akses semua kartu aktif kapan saja, tanpa batas jadwal harian

### Sistem Kuis (Active Recall)

- **Kuis** — ketik jawaban dari ingatan; jawaban dinilai sistem secara objektif; hasil langsung menggerakkan box Leitner
- **Latihan Bebas** — kuis semua kartu aktif tanpa memengaruhi jadwal Leitner; bisa diakses kapan saja

### Spaced Repetition — Sistem Leitner

5 box dengan interval yang makin panjang:

| Box | Interval               |
| --- | ---------------------- |
| 1   | 1 hari (paling sering) |
| 2   | 2 hari                 |
| 3   | 4 hari                 |
| 4   | 7 hari                 |
| 5   | 15 hari (sudah hafal)  |

- Jawaban **benar** di kuis → kartu naik satu box
- Jawaban **salah** → kartu kembali ke box 1
- Dashboard menampilkan sebaran kartu di tiap box, bisa diklik untuk melihat isi

### Kelola Kartu

- Cari, edit, hapus, dan generate ulang kartu
- **Arsip kartu** — kartu yang sudah dikuasai bisa diarsipkan (tidak muncul di sesi belajar/kuis), dan diaktifkan kembali kapan saja
- Tambah kartu langsung dari halaman Kelola

### Autentikasi & Multi-User

- Setiap pengguna login ke akunnya sendiri, data sepenuhnya terpisah
- Signup / Login / Logout dengan email & password
- Lupa password dengan link reset via email
- Data diamankan dengan **Row Level Security (RLS)** di Supabase

---

## Tech Stack

| Bagian      | Teknologi                                           |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript                |
| Styling     | Tailwind CSS                                        |
| Database    | Supabase Postgres                                   |
| Autentikasi | Supabase Auth (`@supabase/ssr`)                     |
| AI Generate | Google Gemini 2.5 Flash (via API route server-side) |
| Pelafalan   | Web Speech API (bawaan browser)                     |
| Hosting     | Vercel                                              |

---

## Cara Menjalankan Secara Lokal

### Prasyarat

- Node.js versi 18 ke atas
- Akun [Supabase](https://supabase.com)
- API key [Google AI Studio](https://aistudio.google.com) (Gemini)

### Langkah Setup

**1. Clone repo**

```bash
git clone https://github.com/mas663/leksa.git
cd leksa
```

**2. Install dependensi**

```bash
npm install
```

**3. Setup Supabase**

Jalankan SQL berikut di Supabase SQL Editor untuk membuat tabel dan mengaktifkan RLS:

```sql
-- Lihat file: supabase/migrations/0001_init.sql
```

**4. Isi environment variables**

Buat file `.env.local` di root proyek:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
AI_API_KEY=AIza...
AI_API_KEY_BACKUP=AIza...   # opsional, fallback otomatis jika key utama kena limit
```

**5. Jalankan dev server**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Struktur Folder Utama

```
app/
  (auth)/login/          # Halaman login
  (auth)/signup/         # Halaman signup
  (auth)/forgot-password/ # Halaman lupa password
  auth/reset-password/   # Halaman reset password (dari link email)
  page.tsx               # Dashboard utama
  add/                   # Tambah kata baru
  study/                 # Sesi belajar flashcard
  study/practice/        # Tinjauan bebas semua kartu
  quiz/                  # Kuis (menggerakkan box Leitner)
  quiz/practice/         # Latihan bebas (tidak menggerakkan box)
  cards/                 # Kelola semua kartu
  api/generate/          # Endpoint AI generate (server-side)
lib/
  supabase/              # Client, server, middleware Supabase
  cards.ts               # CRUD kartu
  leitner.ts             # Logika 5 box + interval
  speech.ts              # Web Speech API wrapper
components/
  Flashcard.tsx          # Komponen kartu bolak-balik
  CardForm.tsx           # Form tambah/edit kartu
  LeitnerBoxes.tsx       # Visualisasi sebaran box
supabase/
  migrations/            # SQL schema & RLS
docs/
  spec-flashcard-app.md  # Spesifikasi lengkap proyek
```

---

## Arsitektur Keamanan

- **Row Level Security (RLS)** aktif di semua tabel — setiap query otomatis difilter per `user_id`
- API key AI disimpan server-side (`AI_API_KEY` tanpa prefix `NEXT_PUBLIC_`) — tidak pernah terekspos ke browser
- `user_id` saat insert kartu selalu diambil dari sesi server (`getUser()`), tidak dari input klien
- Middleware Next.js memverifikasi sesi di setiap request ke route yang dilindungi

---

## Catatan Pengembangan

- Proyek ini dikembangkan sebagai bagian dari **Tugas Akhir** di Institut Teknologi Sepuluh Nopember (ITS), Surabaya
- Sistem AI generate memakai pola **generate-sekali-lalu-cache** — AI hanya dipanggil saat kartu pertama kali dibuat, hasilnya disimpan permanen di database; tidak ada panggilan AI berulang per sesi belajar
- Terdapat mekanisme **fallback otomatis** ke key AI cadangan (`AI_API_KEY_BACKUP`) jika key utama kena rate limit (401/403/429)
- Kuota gratis Gemini 2.5 Flash: ~20 generate/hari per akun Google — cukup untuk pemakaian personal

---

## Lisensi

Proyek ini dibuat untuk keperluan akademis. Silakan gunakan sebagai referensi dengan mencantumkan sumber.
