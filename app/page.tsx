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
          {due > 0 ? (
            <Link
              href="/study"
              className="block w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition"
            >
              Mulai Belajar
            </Link>
          ) : (
            <button
              disabled
              aria-disabled="true"
              className="w-full rounded-xl bg-cool/30 px-4 py-3 font-sans text-sm font-semibold text-white/60 cursor-not-allowed"
            >
              Mulai Belajar
            </button>
          )}
        </div>

        {/* Ringkasan koleksi */}
        <div className="rounded-2xl bg-card border border-line px-6 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-0.5">
              Total kartu
            </p>
            <p className="font-mono text-3xl font-bold text-ink tabular-nums">
              {total}
            </p>
            {archived > 0 && (
              <p className="font-mono text-[0.5625rem] text-muted mt-0.5">
                {archived} diarsipkan
              </p>
            )}
          </div>
          <Link
            href="/cards"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            Kelola →
          </Link>
        </div>

        {/* Sebaran box Leitner */}
        <LeitnerBoxes byBox={byBox} total={total} boxCards={boxCards} />

        {/* Aksi sekunder */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/add"
            className="rounded-xl bg-card border border-line px-3 py-4 flex flex-col items-center gap-1.5 hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted group-hover:text-cool transition-colors"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Tambah kata
            </span>
          </Link>
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
            href="/cards"
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Kelola kartu
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
