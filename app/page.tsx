import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = user.email?.split("@")[0] ?? "Pelajar";

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
              0
            </span>
            <span className="font-sans text-base text-muted">
              kartu siap diulang
            </span>
          </div>
          <p className="font-sans text-sm text-ink-soft mb-5 leading-relaxed">
            Belum ada kartu jatuh tempo. Tambah kata baru untuk mulai belajar.
          </p>
          <button
            disabled
            aria-disabled="true"
            className="w-full rounded-xl bg-cool/30 px-4 py-3 font-sans text-sm font-semibold text-white/60 cursor-not-allowed"
          >
            Mulai Belajar
          </button>
        </div>

        {/* Sebaran box Leitner */}
        <div className="rounded-2xl bg-card border border-line p-5">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-4">
            Sebaran Box Leitner
          </p>
          <div className="flex gap-2 items-end">
            {[1, 2, 3, 4, 5].map((box) => (
              <div key={box} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full h-12 rounded-lg bg-field border border-line flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-muted">0</span>
                </div>
                <span className="font-mono text-[0.625rem] text-muted">
                  {box}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aksi sekunder */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/add"
            className="rounded-xl bg-card border border-line px-3 py-4 text-center hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Tambah kata
            </span>
          </Link>
          <Link
            href="/quiz"
            className="rounded-xl bg-card border border-line px-3 py-4 text-center hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Kuis
            </span>
          </Link>
          <Link
            href="/cards"
            className="rounded-xl bg-card border border-line px-3 py-4 text-center hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group"
          >
            <span className="font-sans text-sm font-medium text-ink-soft group-hover:text-cool transition-colors">
              Kelola kartu
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
