# Spesifikasi Build — Aplikasi Flashcard Bahasa Inggris (Gamifikasi, Multi-User)

Blueprint untuk diserahkan ke Claude Code. Versi ini sudah memakai **Supabase**
(database + autentikasi) sehingga banyak user bisa punya akun masing-masing.
Eksekusi mengikuti urutan fase di bagian akhir; tes tiap fase sebelum lanjut.

---

## 1. Ringkasan & Scope

**Tujuan:** web responsif untuk menghafal kosakata bahasa Inggris dengan flashcard,
ditenagai sistem bucket Leitner (spaced repetition) dan mode kuis (active recall).
Setiap pengguna login ke akunnya sendiri dan datanya terpisah.

**Scope versi 1 (urutan prioritas):**

1. Autentikasi (daftar / login / logout) — wajib lebih dulu karena data terikat user.
2. Flashcard + bucket (Leitner) — inti aplikasi.
3. Mode kuis (active recall).
4. Spaced repetition sebagai mesin di balik bucket.

**Isi tiap kartu:** kata (EN) ↔ terjemahan (ID), jenis kata, contoh kalimat EN+ID,
catatan grammar/tenses, dan pelafalan (Web Speech API browser).

**Cara isi kartu (hybrid):** AI generate sekali saat kata baru ditambahkan lalu
disimpan; tombol generate ulang per kartu; edit manual kapan saja (kartu yang
diedit ditandai `manual`).

---

## 2. Tech Stack

| Bagian    | Pilihan                                      | Alasan                             |
| --------- | -------------------------------------------- | ---------------------------------- |
| Framework | Next.js (App Router) + TypeScript + Tailwind | Familiar, responsif, deploy mudah. |
| Hosting   | Vercel (free)                                | "Buka di mana saja".               |
| Database  | Supabase Postgres                            | Cloud, multi-user, ada RLS bawaan. |
| Auth      | Supabase Auth (`@supabase/ssr`)              | Cookie HTTP-only, aman untuk SSR.  |
| Pelafalan | Web Speech API (`SpeechSynthesis`)           | Gratis, tanpa API key.             |
| AI        | API route Next.js (server-side)              | Key AI aman di env var server.     |

Paket yang dipasang: `@supabase/supabase-js`, `@supabase/ssr`.

**Environment variables (`.env.local`):**

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # boleh juga publishable key (sb_publishable_...)
AI_API_KEY=...                          # TANPA prefix NEXT_PUBLIC — hanya untuk server
```

> Catatan: Supabase sedang transisi penamaan kunci API (anon → publishable,
> service_role → secret). Kunci lama masih jalan selama masa transisi. Verifikasi
> nama kunci terbaru di dashboard/dokumentasi resmi Supabase saat implementasi.
> Service role / secret key TIDAK BOLEH dipakai di sisi browser.

---

## 3. Data Model (Supabase / Postgres)

Jalankan di SQL Editor Supabase:

```sql
create table cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  word          text not null,
  translation   text,
  part_of_speech text,
  example_en    text,
  example_id    text,
  grammar_note  text,
  source        text not null default 'manual' check (source in ('ai','manual')),

  -- Leitner / spaced repetition
  box           int  not null default 1,
  next_review   timestamptz not null default now(),

  -- Statistik & meta
  times_correct int  not null default 0,
  times_wrong   int  not null default 0,
  created_at    timestamptz not null default now(),
  last_reviewed timestamptz
);

create index cards_user_due_idx on cards (user_id, next_review);
```

Tipe TypeScript padanannya:

```ts
interface Card {
  id: string;
  user_id: string;
  word: string;
  translation: string | null;
  part_of_speech: string | null;
  example_en: string | null;
  example_id: string | null;
  grammar_note: string | null;
  source: "ai" | "manual";
  box: number; // 1..5
  next_review: string; // ISO timestamp
  times_correct: number;
  times_wrong: number;
  created_at: string;
  last_reviewed: string | null;
}
```

---

## 4. Keamanan Multi-User — Row Level Security (WAJIB)

Tanpa RLS, semua user bisa membaca/menulis data user lain. Aktifkan RLS dan buat
policy berikut:

```sql
alter table cards enable row level security;

create policy "select own cards" on cards
  for select using (auth.uid() = user_id);

create policy "insert own cards" on cards
  for insert with check (auth.uid() = user_id);

create policy "update own cards" on cards
  for update using (auth.uid() = user_id);

create policy "delete own cards" on cards
  for delete using (auth.uid() = user_id);
```

Prinsip: `auth.uid()` adalah id user dari token sesi; policy memastikan setiap baris
hanya bisa diakses oleh pemiliknya. Saat insert, jangan percaya `user_id` kiriman
klien — ambil dari sesi server.

---

## 5. Autentikasi (Supabase Auth + @supabase/ssr)

**Klien yang dibutuhkan (taruh di `lib/supabase/`):**

- `client.ts` — klien untuk Client Component (browser).
- `server.ts` — klien untuk Server Component, Server Action, Route Handler.
- `middleware.ts` — fungsi `updateSession()` untuk menyegarkan sesi via cookie.

**`middleware.ts` (root proyek):** panggil `updateSession()` + proteksi route.
User yang belum login diarahkan ke `/login`; halaman aplikasi inti hanya untuk yang
sudah login.

**Verifikasi auth di server:** gunakan `supabase.auth.getUser()` (token diverifikasi
ke server auth). Jangan pakai data sesi mentah untuk keputusan otorisasi.

**Alur auth v1 (paling sederhana):** email + password.

- `/signup` — daftar (opsional verifikasi email lewat `auth/callback`).
- `/login` — masuk.
- Tombol logout memanggil `signOut()`.
- Bisa ditambah login Google/OAuth belakangan (di luar scope v1).

---

## 6. Integrasi AI

### Endpoint: `POST /api/generate`

1. Buat server client Supabase, panggil `getUser()`. Jika tidak ada user → tolak (401).
2. Ambil `{ word }` dari body.
3. Panggil provider AI dengan key dari `AI_API_KEY` (server-only).
4. Parse JSON terstruktur, kembalikan ke klien (klien lalu menyimpan kartu dengan
   `user_id` dari sesi, bukan dari input klien).
5. Tangani error (rate limit/jaringan/parse gagal) → beri pesan jelas, sediakan
   fallback isi manual.

### Prompt untuk model

> Instruksi: "Kamu asisten pembuat kartu kosakata bahasa Inggris untuk pelajar
> Indonesia. Untuk satu kata Inggris yang diberikan, kembalikan HANYA objek JSON
> valid tanpa teks lain, tanpa markdown, tanpa ```. Gunakan makna paling umum.
> Pastikan contoh kalimat natural dan catatan grammar akurat."
>
> Input: `Kata: "{word}"`
>
> Skema JSON wajib:
>
> ```json
> {
>   "translation": "terjemahan Indonesia singkat",
>   "partOfSpeech": "noun | verb | adjective | adverb | preposition | ...",
>   "exampleEN": "contoh kalimat Inggris yang natural",
>   "exampleID": "terjemahan Indonesia dari contoh kalimat",
>   "grammarNote": "catatan singkat tenses/bentuk/penggunaan"
> }
> ```
>
> Bersihkan ```atau teks tambahan sebelum`JSON.parse`. Jika gagal parse, jangan
> crash — tawarkan "isi manual" atau "coba lagi".

---

## 7. Logika Leitner (Spaced Repetition)

5 box. Saat kartu dijawab: **benar** → naik satu box (maks 5); **salah** → kembali ke
box 1. Interval (konvensi umum, bisa disetel ulang):

| Box | Jeda muncul lagi |
| --- | ---------------- |
| 1   | 1 hari           |
| 2   | 2 hari           |
| 3   | 4 hari           |
| 4   | 7 hari           |
| 5   | 15 hari          |

`next_review = now() + interval(box)`. Sesi belajar/kuis hanya menampilkan kartu
milik user dengan `next_review <= sekarang`. Tampilkan "X kartu jatuh tempo" di beranda.

---

## 8. Struktur Folder (saran)

```
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  auth/callback/route.ts        // konfirmasi email / OAuth
  (app)/page.tsx                // beranda (protected): ringkasan + jatuh tempo
  (app)/add/page.tsx            // tambah kata (AI / manual)
  (app)/study/page.tsx          // flashcard flip
  (app)/quiz/page.tsx           // mode kuis
  (app)/cards/page.tsx          // kelola/edit semua kartu
  api/generate/route.ts         // endpoint AI (server, verifikasi user)
  layout.tsx
lib/
  supabase/client.ts            // browser client
  supabase/server.ts            // server client
  supabase/middleware.ts        // updateSession()
  cards.ts                      // CRUD kartu ke Supabase
  leitner.ts                    // box, interval, next_review
  speech.ts                     // wrapper Web Speech API
middleware.ts                   // proteksi route + refresh sesi
components/
  Flashcard.tsx
  CardForm.tsx
  QuizCard.tsx
  Stats.tsx
  AuthForm.tsx
```

---

## 9. Alur Layar

1. **Login/Daftar** — pintu masuk; tanpa login tidak bisa akses isi aplikasi.
2. **Beranda** — total kartu, jumlah jatuh tempo hari ini, tombol "Belajar" & "Kuis", logout.
3. **Tambah kata** — ketik kata → "Generate (AI)" mengisi field → user boleh edit → simpan;
   atau isi manual penuh.
4. **Daftar kartu** — lihat/cari/edit/hapus, pelafalan, "Generate ulang" (konfirmasi bila `manual`).
5. **Belajar (flip)** — kartu bolak-balik; tombol "Tahu/Belum" menggerakkan box Leitner.
6. **Kuis (active recall)** — tampilkan arti/kata, user menjawab, dinilai, update box & statistik.

---

## 10. Pelafalan (Web Speech API)

```ts
function speak(word: string) {
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
```

Cek dukungan (`"speechSynthesis" in window`); nonaktifkan tombol bila tak didukung.

---

## 11. Prompt Bertahap untuk Claude Code

**Fase 0 — Supabase & skema**

> "Siapkan proyek Supabase. Buat tabel `cards` dan policy RLS sesuai spesifikasi
> (section 3 & 4). Pastikan RLS aktif. Catat URL dan anon/publishable key untuk env."

**Fase 1 — Scaffold + Auth**

> "Buat proyek Next.js (App Router) + TypeScript + Tailwind. Pasang `@supabase/supabase-js`
> dan `@supabase/ssr`. Buat `lib/supabase/client.ts`, `server.ts`, `middleware.ts`, dan
> `middleware.ts` root untuk refresh sesi + proteksi route. Buat halaman `/login` dan
> `/signup` (email+password) plus tombol logout. Route aplikasi inti hanya untuk user
> login; verifikasi server pakai `getUser()`."

**Fase 2 — CRUD kartu + beranda**

> "Buat `lib/cards.ts` berisi CRUD ke tabel `cards` (addCard, updateCard, deleteCard,
> getCards, getDueCards) yang otomatis terikat user lewat RLS. Buat beranda (protected)
> yang menampilkan total kartu user dan jumlah jatuh tempo."

**Fase 3 — Tambah kartu + AI + manual**

> "Buat halaman `/add` dengan `CardForm`. Mode manual mengisi semua field. Mode AI
> memanggil `/api/generate` (route server yang memverifikasi user via getUser dan
> menyimpan key di AI_API_KEY). Isi field dari hasil AI, user boleh edit sebelum simpan.
> Tandai source 'ai'/'manual' sesuai aturan. Saat insert, ambil user_id dari sesi server."

**Fase 4 — Flashcard + Leitner**

> "Buat `lib/leitner.ts` (5 box, interval & next_review sesuai spesifikasi). Buat
> `Flashcard` yang bisa dibolak-balik + tombol pelafalan (Web Speech API). Buat
> `/study` yang menampilkan kartu jatuh tempo; tombol 'Tahu/Belum' menggerakkan box
> dan menjadwalkan ulang."

**Fase 5 — Mode kuis**

> "Buat `/quiz` (active recall): tampilkan arti, user mengetik/memilih kata EN, nilai
> benar/salah, update box Leitner & statistik."

**Fase 6 — Kelola & generate ulang**

> "Buat `/cards`: daftar, cari, edit, hapus, pelafalan, dan 'Generate ulang' per kartu
> (konfirmasi bila source 'manual')."

---

## 12. Catatan Penting

- **RLS adalah batas keamanan utama** multi-user. Pastikan aktif sebelum data nyata masuk.
- **Jangan percaya user_id dari klien** — selalu ambil dari sesi server saat insert.
- **Key AI & secret Supabase hanya di server** (tanpa prefix NEXT_PUBLIC).
- **Akurasi AI tidak dijamin** — itulah gunanya edit manual & generate ulang.
- **Kuota free tier** Supabase & provider AI berubah-ubah; cek dokumentasi resmi.
- **Gamifikasi lanjutan** (XP, streak, level) ditunda; Leitner + kuis sudah cukup untuk v1.

---

## 13. Arah Desain UI/UX

Tujuan: terasa seperti alat belajar premium yang menenangkan, fokus, dan memberi
imbalan emosional saat berhasil. Hindari tiga "tampilan default AI": (1) krem +
serif kontras-tinggi + terracotta, (2) hitam-pekat + satu aksen acid-green, (3)
tata letak koran bergaris rambut. Saat membangun, Claude Code WAJIB membaca skill
`frontend-design` lebih dulu, lalu menurunkan setiap warna & tipe dari token di bawah.

### 13.1 Konsep & sudut pandang

"Focused calm with a spark." Kanvas tenang berwarna petrol dalam untuk kenyamanan
sesi panjang; kartu adalah permukaan terang tempat kata bersinar. Satu aksen amber
hangat HANYA muncul pada momen keberhasilan (jawaban benar, kartu naik box, streak).
Boldness dihabiskan di satu tempat: animasi flip kartu + "jalur perjalanan" Leitner.

### 13.2 Token warna

```
--bg-field      #122A2E   /* kanvas/latar utama (petrol dalam) */
--bg-field-2    #183A3F   /* panel/elevasi rendah */
--surface-card  #FAFCFB   /* permukaan kartu — kata dibaca di sini */
--ink           #0C1F22   /* teks utama di kartu terang */
--ink-soft      #44595C   /* teks sekunder di kartu */
--on-field      #DCEAEA   /* teks di atas kanvas gelap */
--muted         #7C9598   /* caption/label, teks tersier */
--accent-cool   #36C2B4   /* aksi interaktif/primer, fokus, link (teal terang) */
--accent-reward #F2A23C   /* HANYA keberhasilan: benar, naik box, streak (amber) */
--danger        #E26D5A   /* salah/hapus (terakota lembut, dipakai hemat) */
--line          rgba(220,234,234,0.12)  /* garis pemisah halus di kanvas gelap */
```

Disiplin warna: `--accent-cool` untuk tombol & elemen interaktif sehari-hari;
`--accent-reward` jangan dipakai untuk hiasan — simpan untuk momen menang saja.

### 13.3 Tipografi (peran linguistik)

- **Headword (kata EN):** sans berkarakter & presisi — mis. _Space Grotesk_ atau
  _Hanken Grotesk_. Besar, tegas (rasa entri kamus).
- **Contoh kalimat (prosa):** serif baca yang hangat — mis. _Newsreader_ atau
  _Source Serif 4_ (rasa sastra; membedakan "kalimat" dari "data").
- **Fonetik/IPA, nomor box, statistik, label:** monospace — mis. _Space Mono_ atau
  _JetBrains Mono_ (rasa data/fonetik).

Skala tipe (titik awal, sesuaikan):

```
Headword      clamp(2.5rem, 6vw, 4rem), weight 600, tracking -0.02em
IPA (mono)    1rem, --muted, di bawah headword
Contoh (serif) 1.125rem, line-height 1.7
Label (mono)  0.75rem, uppercase, tracking 0.12em, --muted
```

### 13.4 Layout & wireframe

Layar belajar (hero = kartu):

```
+--------------------------------------------------+
|  ←        BOX 2 • 12 jatuh tempo        🔥 5     |   <- header tipis
|                                                  |
|        +--------------------------------+        |
|        |                                |        |
|        |          obstinate             |        |   <- headword (sans)
|        |          /ˈɒb.stɪ.nət/   🔊     |        |   <- IPA (mono) + pelafalan
|        |                                |        |
|        |   [ klik untuk lihat arti ]    |        |
|        +--------------------------------+        |   <- kartu flip 3D
|                                                  |
|     ●───●───○───○───○   (jalur Leitner)          |   <- progress 5 stasiun
|                                                  |
|     [  Belum hafal  ]     [  Tahu  ]             |   <- aksi (cool / reward saat benar)
+--------------------------------------------------+
```

Beranda (dashboard tenang):

```
+--------------------------------------------------+
|  Halo, {nama}                         🔥 5 hari  |
|                                                  |
|   12  kartu siap diulang hari ini                |   <- angka fokus, CTA utama
|   [        Mulai Belajar        ]                |
|                                                  |
|   Sebaran box:  ▮▮▮▮ ▮▮ ▮ ▯ ▯                    |   <- distribusi Leitner
|   [ Tambah kata ]  [ Kuis ]  [ Kelola kartu ]    |
+--------------------------------------------------+
```

### 13.5 Signature element

1. **Kartu flip bertekstur:** transform `rotateY` 3D dengan easing + sedikit angkat
   bayangan saat hover/aktif, supaya terasa seperti objek nyata yang dibalik.
2. **Jalur Leitner:** 5 stasiun yang dilewati kata; saat naik box, penanda bergerak
   maju ke stasiun berikutnya — kemajuan yang terlihat & terasa.
3. **Momen lulus:** saat kartu mencapai box 5 (mastered), kilatan amber singkat.

### 13.6 Motion (hemat & bermakna)

- Flip kartu: ~0.4s `cubic-bezier(0.2,0.8,0.2,1)`.
- Jawaban benar: kartu sedikit terangkat lalu penanda maju di jalur.
- Dashboard saat dibuka: stagger halus pada elemen.
- WAJIB hormati `prefers-reduced-motion: reduce` (matikan transform besar).

### 13.7 Microcopy (suara antarmuka, aktif & jelas)

- Tombol pakai kata kerja: "Tahu", "Belum hafal", "Simpan kata", "Mulai Belajar".
- Nama aksi konsisten dari tombol sampai notifikasi ("Simpan" → toast "Tersimpan").
- Empty state = ajakan: "Belum ada kartu jatuh tempo. Tambah kata baru untuk mulai."
- Error dalam suara antarmuka, jelas & solutif: "Gagal menyimpan — periksa koneksi
  lalu coba lagi." (bukan minta maaf, bukan samar).
- Sebut hal dari sisi pengguna (mis. "kata", "box", "streak"), bukan istilah sistem.

### 13.8 Quality floor (tidak bisa ditawar)

- Responsif mulus sampai layar ponsel (kartu tetap nyaman dipakai satu tangan).
- Fokus keyboard terlihat jelas (`--accent-cool` outline); seluruh alur bisa
  dioperasikan via keyboard.
- Kontras teks memadai (WCAG AA) di mode gelap maupun di kartu terang.
- Loading & skeleton untuk data dari Supabase; jangan tampilkan layar kosong "lompat".
- Semantik HTML benar (heading, button, label form).

### 13.9 Catatan eksekusi untuk Claude Code

- Baca skill `frontend-design` sebelum menyentuh UI.
- Pasang font via `next/font` (mis. Google Fonts) sesuai peran di 13.3.
- Definisikan token 13.2 sebagai CSS variables di `globals.css`, lalu peta ke konfigurasi
  Tailwind agar dipakai konsisten (hindari nilai hex tersebar di komponen).
- Hati-hati spesifisitas selektor CSS (padding/margin antar-section sering saling batal).
