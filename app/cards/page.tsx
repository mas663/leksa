import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getCards } from "@/lib/cards";
import CardsClient from "./CardsClient";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cards = await getCards();

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
        <div className="pb-6">
          <Link
            href="/"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline mb-4 inline-block"
          >
            ← Kembali
          </Link>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-sans text-2xl font-semibold text-ink">
              Kelola Kartu
            </h1>
            <Link
              href="/add?from=/cards"
              className="rounded-xl border border-line bg-card px-3 py-2.5 flex items-center gap-1.5 hover:border-cool/50 hover:bg-cool/5 focus:outline-none focus:ring-2 focus:ring-cool transition-colors group shrink-0"
            >
              <svg
                width="14"
                height="14"
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
                Tambah Kata
              </span>
            </Link>
          </div>
          <p className="font-sans text-sm text-ink-soft mt-1">
            Semua kartu kamu — tambah, cari, edit, hapus, atau generate ulang.
          </p>
        </div>

        <CardsClient initialCards={cards} />
      </main>
    </div>
  );
}
