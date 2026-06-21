import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import CardForm from "@/components/CardForm";

const ALLOWED_BACK: Record<string, string> = {
  "/cards": "/cards",
  "/quiz": "/quiz",
  "/quiz/practice": "/quiz/practice",
  "/study": "/study",
};

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { from } = await searchParams;
  const backHref = (from && ALLOWED_BACK[from]) ?? "/";

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
            href={backHref}
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline mb-4 inline-block"
          >
            ← Kembali
          </Link>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Tambah Kata
          </h1>
          <p className="font-sans text-sm text-ink-soft mt-1">
            Isi kata baru dengan bantuan AI atau secara manual.
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-line p-6">
          <CardForm />
        </div>
      </main>
    </div>
  );
}
