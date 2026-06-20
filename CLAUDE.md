# CLAUDE.md — Aplikasi Flashcard Bahasa Inggris (Gamifikasi, Multi-User)

Konstitusi proyek. Patuhi ini di setiap sesi. Spesifikasi lengkap ada di
`docs/spec-flashcard-app.md` — baca section yang relevan saat mengerjakan tiap fase
(jangan muat seluruh file kalau tidak perlu).

## Ringkasan

Web responsif untuk menghafal kosakata Inggris: flashcard bolak-balik + pelafalan,
sistem box Leitner (spaced repetition), dan mode kuis (active recall). Multi-user:
tiap akun punya datanya sendiri.

## Stack (jangan diganti tanpa konfirmasi)

- Next.js (App Router) + TypeScript + Tailwind
- Supabase Postgres (database) + Supabase Auth via `@supabase/ssr`
- Web Speech API untuk pelafalan (tanpa API key)
- AI generation lewat API route server-side (key di env, bukan di klien)
- Deploy: Vercel

## Aturan keamanan (WAJIB, jangan dilanggar)

1. Row Level Security (RLS) WAJIB aktif di tabel `cards` sebelum data nyata masuk.
2. Saat insert/update kartu, ambil `user_id` dari sesi server (`getUser()`),
   JANGAN dari input klien.
3. Verifikasi auth di server pakai `supabase.auth.getUser()` (token diverifikasi),
   bukan sesi mentah untuk keputusan otorisasi.
4. Secret (key AI, service/secret key Supabase) HANYA di server. Variabel rahasia
   tanpa prefix `NEXT_PUBLIC_`. Jangan pernah commit `.env*`.

## Aturan arsitektur

- CRUD kartu terpusat di `lib/cards.ts`. Komponen tidak query Supabase langsung
  sembarangan.
- Logika Leitner terpusat di `lib/leitner.ts` (5 box, interval di spec section 7).
- Klien Supabase di `lib/supabase/` (`client.ts`, `server.ts`, `middleware.ts`).
- Penanda kartu: `source` = `ai` atau `manual`. Begitu user edit manual → `manual`.

## Aturan desain UI/UX

- Sebelum menyentuh UI, baca skill `frontend-design`.
- Sumber kebenaran warna & tipografi = spec section 13. Definisikan token sebagai
  CSS variables di `globals.css`, lalu peta ke Tailwind. Jangan sebar hex di komponen.
- Mood: tenang & fokus (petrol dalam + amber sebagai warna keberhasilan SAJA).
- Tipografi per peran: sans (headword), serif (contoh kalimat), mono (IPA/angka).
- Quality floor: responsif sampai ponsel, fokus keyboard terlihat, kontras AA,
  hormati `prefers-reduced-motion`, ada loading/skeleton untuk data Supabase.

## Alur kerja eksekusi

- Bangun BERTAHAP sesuai spec section 11: Fase 0 → 1 → 2 → 3 → 4 → 5 → 6.
- Kerjakan SATU fase per tugas. Tes dulu sebelum lanjut fase berikutnya.
- Commit per fase dengan pesan jelas (mis. `feat: fase 1 auth`).
- Jika ada keputusan arsitektur ambigu, berhenti dan tanya, jangan menebak.

## Bahasa

- UI dan microcopy dalam Bahasa Indonesia, kata kerja aktif (lihat spec section 13.7).
- Komunikasi penjelasan ke developer boleh Bahasa Indonesia.

## Perintah proyek

(Diisi setelah scaffold Fase 1, contoh:)

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
