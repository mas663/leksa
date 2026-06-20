import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[--bg-field] p-6">
      <header className="max-w-2xl mx-auto flex items-center justify-between mb-12">
        <h1 className="text-xl font-bold text-[--on-field]">Leksa</h1>
        <form>
          <button
            type="submit"
            formAction={logout}
            className="text-sm text-[--muted] hover:text-[--on-field] focus:outline-none focus:underline transition-colors"
          >
            Keluar
          </button>
        </form>
      </header>

      <div className="max-w-2xl mx-auto">
        <p className="text-[--muted] text-sm mb-1">Selamat datang,</p>
        <p className="text-[--on-field] font-medium mb-8 truncate">{user.email}</p>

        <div className="rounded-xl border border-[--line] bg-[--bg-field-2] p-6 text-center">
          <p className="text-[--muted] text-sm">
            Belum ada kartu. Tambahkan kata pertamamu untuk mulai belajar.
          </p>
        </div>
      </div>
    </main>
  );
}
