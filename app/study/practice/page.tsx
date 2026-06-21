import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getActiveCards } from "@/lib/cards";
import StudyClient from "../StudyClient";

export const dynamic = "force-dynamic";

export default async function StudyPracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cards = await getActiveCards();

  if (cards.length === 0) redirect("/add");

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
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-1">
            {cards.length} kartu aktif
          </p>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Tinjauan Bebas
          </h1>
        </div>

        <StudyClient cards={cards} mode="review" />
      </main>
    </div>
  );
}
