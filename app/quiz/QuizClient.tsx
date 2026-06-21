"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Card } from "@/lib/cards";
import { advanceBox, BOX_INTERVALS } from "@/lib/leitner";
import { markCorrect, markIncorrect } from "./actions";

interface QuizClientProps {
  cards: Card[];
  mode: "normal" | "practice";
  totalCards: number;
}

function getPrompt(card: Card): string {
  if (card.translation) return card.translation;
  if (card.example_id) return card.example_id;
  return "(tidak ada terjemahan)";
}

export default function QuizClient({ cards, mode, totalCards }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [session, setSession] = useState({ correct: 0, wrong: 0 });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (cards.length === 0) {
    if (totalCards === 0) {
      return (
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
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="font-sans text-base text-ink-soft">
          Tidak ada kartu jatuh tempo untuk dikuis.
        </p>
        <p className="font-sans text-sm text-muted">
          Semua kartu sudah diulang hari ini. Coba latihan bebas atau kembali
          lagi nanti.
        </p>
        <div className="flex gap-4 mt-2">
          <Link
            href="/quiz/practice"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            Latihan Bebas →
          </Link>
          <Link
            href="/study"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            Belajar Flashcard
          </Link>
        </div>
        <Link
          href="/"
          className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted hover:text-ink focus:outline-none focus:underline"
        >
          ← Beranda
        </Link>
      </div>
    );
  }

  const done = currentIndex >= cards.length;

  if (done) {
    const total = session.correct + session.wrong;
    const pct = total > 0 ? Math.round((session.correct / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-2xl bg-card border border-line p-8 w-full">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-3">
            {mode === "practice" ? "Latihan selesai" : "Kuis selesai"}
          </p>
          <p className="font-sans text-3xl font-semibold text-ink mb-1">
            {pct >= 80
              ? "Kerja bagus!"
              : pct >= 50
              ? "Terus berlatih!"
              : "Jangan menyerah!"}
          </p>
          <p className="font-sans text-sm text-ink-soft mb-6 leading-relaxed">
            Kamu menjawab {total} soal — skor {pct}%.
            {mode === "practice" && (
              <span className="block mt-1 text-muted text-xs">
                Mode latihan — progres Leitner tidak berubah.
              </span>
            )}
          </p>

          <div className="flex gap-6 mb-6">
            <div className="flex-1 rounded-xl bg-reward/8 border border-reward/20 px-4 py-4 text-center">
              <p className="font-mono text-3xl font-bold text-reward tabular-nums">
                {session.correct}
              </p>
              <p className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em] mt-1">
                Benar
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-danger/5 border border-danger/20 px-4 py-4 text-center">
              <p className="font-mono text-3xl font-bold text-danger tabular-nums">
                {session.wrong}
              </p>
              <p className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em] mt-1">
                Salah
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/quiz/practice";
              }}
              className="flex-1 rounded-xl border border-cool/40 bg-cool/5 px-4 py-3 font-sans text-sm font-semibold text-cool hover:bg-cool/10 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition flex items-center justify-center gap-2"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.88" />
              </svg>
              {mode === "practice" ? "Ulangi Latihan" : "Latihan Lagi"}
            </button>
            <Link
              href="/"
              className="flex-1 rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition flex items-center justify-center gap-2"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const isCorrect = lastResult === "correct";
  const isWrong = lastResult === "wrong";

  function handleSubmit() {
    if (isPending || phase !== "answering") return;
    const trimmed = input.trim().toLowerCase();
    const correct = card.word.trim().toLowerCase();
    const isRight = trimmed === correct;
    setLastResult(isRight ? "correct" : "wrong");
    setPhase("feedback");

    if (mode === "normal") {
      startTransition(async () => {
        if (isRight) {
          await markCorrect(card.id, card.box, card.times_correct);
          setSession((s) => ({ ...s, correct: s.correct + 1 }));
        } else {
          await markIncorrect(card.id, card.times_wrong);
          setSession((s) => ({ ...s, wrong: s.wrong + 1 }));
        }
      });
    } else {
      if (isRight) {
        setSession((s) => ({ ...s, correct: s.correct + 1 }));
      } else {
        setSession((s) => ({ ...s, wrong: s.wrong + 1 }));
      }
    }
  }

  function handleNext() {
    setInput("");
    setLastResult(null);
    setPhase("answering");
    setCurrentIndex((i) => i + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleNextKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNext();
    }
  }

  const newBox = advanceBox(card.box);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress + mode badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em]">
            {currentIndex + 1} / {cards.length}
          </p>
          {mode === "practice" && (
            <span className="inline-flex items-center rounded-full bg-ink/8 px-2 py-0.5 font-mono text-[0.5625rem] text-ink-soft uppercase tracking-[0.08em]">
              Latihan
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {session.correct > 0 && (
            <span className="font-mono text-[0.625rem] text-reward tabular-nums">
              {session.correct} benar
            </span>
          )}
          {session.wrong > 0 && (
            <span className="font-mono text-[0.625rem] text-danger tabular-nums">
              {session.wrong} salah
            </span>
          )}
        </div>
      </div>

      {/* Kartu kuis */}
      <div
        className={[
          "rounded-2xl bg-card border p-6 transition-colors",
          isCorrect
            ? "border-reward ring-2 ring-reward/40"
            : isWrong
            ? "border-danger/40"
            : "border-line",
        ].join(" ")}
      >
        {/* Label */}
        <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-3">
          {card.part_of_speech ? `${card.part_of_speech} · ` : ""}Terjemahkan
          ke Bahasa Inggris
        </p>

        {/* Prompt: translation */}
        <p className="font-serif text-2xl text-ink leading-snug mb-1">
          {getPrompt(card)}
        </p>

        {/* Contoh kalimat (hint) */}
        {card.example_en && phase === "feedback" && (
          <p className="font-serif text-sm text-ink-soft italic leading-relaxed mt-2">
            &ldquo;{card.example_en}&rdquo;
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-line my-4" />

        {/* Input / Feedback */}
        {phase === "answering" ? (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik kata Bahasa Inggris…"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
              className="flex-1 rounded-xl border border-line bg-field px-4 py-3 font-sans text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-cool focus:border-transparent transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || input.trim() === ""}
              className="rounded-xl bg-cool px-5 py-3 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Periksa
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Jawaban user */}
            <div className="flex items-start gap-3">
              <div
                className={[
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                  isCorrect ? "bg-reward text-white" : "bg-danger text-white",
                ].join(" ")}
              >
                {isCorrect ? (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em] mb-0.5">
                  Jawabanmu
                </p>
                <p
                  className={[
                    "font-sans text-base font-semibold",
                    isCorrect ? "text-reward" : "text-danger",
                  ].join(" ")}
                >
                  {input.trim() || "(kosong)"}
                </p>
              </div>
            </div>

            {/* Jawaban benar (hanya tampil saat salah) */}
            {isWrong && (
              <div className="rounded-xl bg-field border border-line px-4 py-3">
                <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em] mb-0.5">
                  Jawaban benar
                </p>
                <p className="font-sans text-base font-semibold text-ink">
                  {card.word}
                </p>
                {mode === "normal" && (
                  <p className="font-mono text-[0.6875rem] text-muted mt-0.5">
                    Box direset ke 1 — muncul lagi besok
                  </p>
                )}
              </div>
            )}

            {/* Info naik box saat benar — hanya mode normal */}
            {isCorrect && mode === "normal" && (
              <div className="rounded-xl bg-reward/8 border border-reward/20 px-4 py-3">
                <p className="font-sans text-sm font-semibold text-reward">
                  {card.word}
                </p>
                <p className="font-mono text-[0.6875rem] text-muted mt-0.5">
                  {card.box < 5
                    ? `Naik ke box ${newBox} — muncul lagi dalam ${BOX_INTERVALS[newBox]} hari`
                    : "Sudah di box 5 — muncul lagi dalam 15 hari"}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              onKeyDown={handleNextKeyDown}
              disabled={isPending}
              className="w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                "Menyimpan…"
              ) : currentIndex + 1 < cards.length ? (
                <>
                  Lanjut
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              ) : (
                <>
                  Lihat hasil
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hint: tekan Enter */}
      {phase === "answering" && (
        <p className="font-mono text-[0.625rem] text-muted text-center tracking-[0.08em]">
          Tekan Enter untuk memeriksa
        </p>
      )}
    </div>
  );
}
