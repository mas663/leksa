import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getCardCounts, getCardsForBoxPreview } from "@/lib/cards";
import LeitnerBoxes from "@/components/LeitnerBoxes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = user.email?.split("@")[0] ?? "Pelajar";
  const [{ total, due, archived, byBox }, previewCards] = await Promise.all([
    getCardCounts(),
    getCardsForBoxPreview(),
  ]);
  const boxCards: Record<number, { id: string; word: string; translation: string | null }[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [],
  };
  for (const c of previewCards) {
    boxCards[c.box]?.push({ id: c.id, word: c.word, translation: c.translation });
  }

  return (
    <div className="min-h-screen bg-field">
      {/* Header */}
      <header className="border-b border-line bg-card px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="font-sans text-lg font-bold tracking-tight select-none">
            <span className="text-cool">L</span>
            <span className="text-ink">eksa</span>
          </span>
          <form>
            <button
              type="submit"
              formAction={logout}
              className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted hover:text-ink focus:outline-none focus:underline transition-colors"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-4">
        {/* Salam */}
        <div className="pb-2">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-1">
            Selamat datang,
          </p>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            {displayName}
          </h1>
        </div>

        {/* Panel kartu jatuh tempo — CTA utama */}
        <div className="rounded-2xl bg-card border border-line p-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-5xl font-bold text-ink tabular-nums">
              {due}
            </span>
            <span className="font-sans text-base text-muted">
              kartu siap diulang
            </span>
          </div>
          <p className="font-sans text-sm text-ink-soft mb-5 leading-relaxed">
            {due === 0
              ? total === 0
                ? "Belum ada kartu. Tambah kata baru untuk mulai belajar."
                : "Semua kartu sudah diulang. Kembali lagi nanti."
              : `Ada ${due} kartu yang perlu diulang hari ini.`}
          </p>
          <div className="flex gap-3">
            {due > 0 ? (
              <Link
                href="/study"
                className="flex-1 rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition"
              >
                Mulai Belajar
              </Link>
            ) : (
              <button
                disabled
                aria-disabled="true"
                className="flex-1 rounded-xl bg-cool/30 px-4 py-3 font-sans text-sm font-semibold text-white/60 cursor-not-allowed"
              >
                Mulai Belajar
              </button>
            )}
            <Link
              href="/study/practice"
              aria-label="Tinjauan Bebas"
              className="rounded-xl border border-line bg-field px-3.5 py-3 text-muted hover:border-cool/50 hover:text-cool hover:bg-cool/5 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Navigasi koleksi — Tambah & Kelola */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tambah kata — solid cool */}
          <Link
            href="/add"
            className="rounded-2xl bg-cool p-5 flex flex-col justify-between min-h-34 hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-base font-semibold text-white leading-snug">
                Tambah kata
              </p>
              <p className="font-sans text-xs text-white/75 mt-0.5">
                Perluas koleksimu
              </p>
            </div>
          </Link>

          {/* Kelola kartu — kartu putih standar */}
          <Link
            href="/cards"
            className="rounded-2xl bg-card border border-line p-5 flex flex-col justify-between hover:border-cool/40 hover:bg-cool/5 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition group"
          >
            <div className="w-10 h-10 rounded-full bg-field flex items-center justify-center shrink-0 group-hover:bg-cool/10 transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted group-hover:text-cool transition-colors"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-base font-semibold text-ink leading-snug group-hover:text-cool transition-colors">
                Kelola kartu
              </p>
              <p className="font-mono text-xs text-muted mt-0.5 tabular-nums">
                {total - archived} kartu aktif
              </p>
            </div>
          </Link>
        </div>

        {/* Sebaran box Leitner */}
        <LeitnerBoxes byBox={byBox} total={total} boxCards={boxCards} />

        {/* Aksi sekunder */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/quiz"
            className="rounded-xl bg-card border border-line px-3 py-4 flex flex-col items-center gap-1.5 hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted group-hover:text-cool transition-colors"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Kuis
            </span>
          </Link>
          <Link
            href="/quiz/practice"
            className="rounded-xl bg-card border border-line px-3 py-4 flex flex-col items-center gap-1.5 hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted group-hover:text-cool transition-colors"
              aria-hidden="true"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Latihan Bebas
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
