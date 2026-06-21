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
        <main className="max-w-xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="font-sans text-base text-ink-soft">
              Belum ada kartu sama sekali.
            </p>
            <p className="font-sans text-sm text-muted">
              Tambah kata baru untuk mulai belajar.
            </p>
            <Link
              href="/add"
              className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
            >
              + Tambah kata pertama
            </Link>
            <Link
              href="/"
              className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted hover:text-ink focus:outline-none focus:underline"
            >
              ← Beranda
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
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted hover:text-ink focus:outline-none focus:underline transition-colors"
            >
              ← Beranda
            </Link>
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
