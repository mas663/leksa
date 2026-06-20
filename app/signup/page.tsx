import Link from "next/link";
import { signup } from "@/app/auth/actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-field flex flex-col items-center justify-center p-4">
      {/* Brand mark */}
      <div className="mb-8 text-center select-none">
        <p className="font-sans text-3xl font-bold text-on-field tracking-tight">
          Leksa
        </p>
        <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.2em] mt-1">
          Flashcard Bahasa Inggris
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-88 rounded-2xl bg-card p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <h1 className="font-sans text-xl font-semibold text-ink mb-1">Daftar</h1>
        <p className="font-sans text-sm text-ink-soft mb-7">
          Mulai hafal kosakata dengan cara yang menyenangkan
        </p>

        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-soft mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="kamu@email.com"
              className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-cool transition-shadow"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-soft mb-1.5"
            >
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-cool transition-shadow"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="font-sans text-sm text-danger rounded-lg bg-danger/5 border border-danger/20 px-3.5 py-2.5"
            >
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            formAction={signup}
            className="w-full rounded-lg bg-cool px-4 py-3 font-sans text-sm font-semibold text-field hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors"
          >
            Buat akun
          </button>
        </form>
      </div>

      <p className="mt-6 font-sans text-sm text-muted">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-cool hover:underline focus:outline-none focus:underline"
        >
          Masuk
        </Link>
      </p>
    </main>
  );
}
