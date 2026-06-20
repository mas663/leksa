import Link from "next/link";
import { login } from "@/app/auth/actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[--bg-field] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[--on-field] mb-2 text-center">
          Masuk ke Leksa
        </h1>
        <p className="text-[--muted] text-sm text-center mb-8">
          Lanjutkan sesi belajarmu
        </p>

        <form className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[--on-field] mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[--line] bg-[--bg-field-2] px-3 py-2.5 text-[--on-field] placeholder-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent-cool]"
              placeholder="kamu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[--on-field] mb-1"
            >
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[--line] bg-[--bg-field-2] px-3 py-2.5 text-[--on-field] placeholder-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent-cool]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-[--danger] text-sm rounded-lg bg-[--bg-field-2] border border-[--danger]/30 px-3 py-2">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            formAction={login}
            className="w-full rounded-lg bg-[--accent-cool] px-4 py-2.5 font-semibold text-[--bg-field] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[--accent-cool] focus:ring-offset-2 focus:ring-offset-[--bg-field] transition-opacity"
          >
            Masuk
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[--muted]">
          Belum punya akun?{" "}
          <Link
            href="/signup"
            className="text-[--accent-cool] hover:underline focus:outline-none focus:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  );
}
