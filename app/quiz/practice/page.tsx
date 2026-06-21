import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getActiveCards } from "@/lib/cards";
import QuizClient from "../QuizClient";

export const dynamic = "force-dynamic";

export default async function PracticeQuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cards = await getActiveCards();
  const totalCards = cards.length;

  if (totalCards === 0) {
    return (
      <div className="min-h-screen bg-field">
        <header className="border-b border-line bg-card px-6 py-4">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="font-sans text-lg font-bold tracking-tight select-none"
            >
              <span className="text-cool">L</span>
              <span className="text-ink">eksa</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 font-sans text-sm font-medium text-ink-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-cool transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Kembali
              </Link>
              <form>
                <button
                  type="submit"
                  formAction={logout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-transparent px-3 py-1.5 font-sans text-sm font-medium text-muted hover:text-ink-soft hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-cool transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="font-sans text-base text-ink-soft">
              Belum ada kartu sama sekali.
            </p>
            <p className="font-sans text-sm text-muted">
              Tambah kata baru untuk mulai belajar.
            </p>
            <Link
              href="/add?from=/quiz/practice"
              className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
            >
              + Tambah kata pertama
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Shuffle cards for variety in practice sessions
  const shuffled = [...cards].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen bg-field">
      <header className="border-b border-line bg-card px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-lg font-bold tracking-tight select-none"
          >
            <span className="text-cool">L</span>
            <span className="text-ink">eksa</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 font-sans text-sm font-medium text-ink-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-cool transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Kembali
            </Link>
            <form>
              <button
                type="submit"
                formAction={logout}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-transparent px-3 py-1.5 font-sans text-sm font-medium text-muted hover:text-ink-soft hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-cool transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <div className="pb-6">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em]">
              {totalCards} kartu aktif · semua koleksi
            </p>
            <span className="inline-flex items-center rounded-full border border-ink/15 px-2 py-0.5 font-mono text-[0.5625rem] text-ink-soft uppercase tracking-[0.08em]">
              Mode Latihan
            </span>
          </div>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Latihan Bebas
          </h1>
          <p className="font-sans text-sm text-muted mt-1">
            Jawaban tidak memengaruhi progres box Leitner kamu.
          </p>
        </div>

        <QuizClient cards={shuffled} mode="practice" totalCards={totalCards} />
      </main>
    </div>
  );
}
