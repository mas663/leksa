import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getDueCards } from "@/lib/cards";
import StudyClient from "./StudyClient";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cards = await getDueCards();

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
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-1">
            {cards.length > 0
              ? `${cards.length} kartu jatuh tempo`
              : "Tidak ada kartu jatuh tempo"}
          </p>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Belajar
          </h1>
        </div>

        <StudyClient cards={cards} />
      </main>
    </div>
  );
}
