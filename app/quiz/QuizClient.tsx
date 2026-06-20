"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Card } from "@/lib/cards";
import { advanceBox } from "@/lib/leitner";
import { markCorrect, markIncorrect } from "./actions";

interface QuizClientProps {
  cards: Card[];
}

function getPrompt(card: Card): string {
  if (card.translation) return card.translation;
  if (card.example_id) return card.example_id;
  return "(tidak ada terjemahan)";
}

export default function QuizClient({ cards }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [session, setSession] = useState({ correct: 0, wrong: 0 });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="font-sans text-base text-ink-soft">
          Tidak ada kartu jatuh tempo untuk dikuis.
        </p>
        <p className="font-sans text-sm text-muted">
          Tambah kartu baru atau tunggu hingga interval kartu berlalu.
        </p>
        <div className="flex gap-4 mt-2">
          <Link
            href="/add"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            + Tambah kartu
          </Link>
          <Link
            href="/study"
            className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            → Belajar
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
            Kuis selesai
          </p>
          <p className="font-sans text-3xl font-semibold text-ink mb-1">
            {pct >= 80 ? "Kerja bagus!" : pct >= 50 ? "Terus berlatih!" : "Jangan menyerah!"}
          </p>
          <p className="font-sans text-sm text-ink-soft mb-6 leading-relaxed">
            Kamu menjawab {total} soal — skor {pct}%.
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

          <Link
            href="/"
            className="block w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors"
          >
            Kembali ke beranda
          </Link>
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

    startTransition(async () => {
      if (isRight) {
        await markCorrect(card.id, card.box, card.times_correct);
        setSession((s) => ({ ...s, correct: s.correct + 1 }));
      } else {
        await markIncorrect(card.id, card.times_wrong);
        setSession((s) => ({ ...s, wrong: s.wrong + 1 }));
      }
    });
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
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em]">
          {currentIndex + 1} / {cards.length}
        </p>
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
          {card.part_of_speech ? `${card.part_of_speech} · ` : ""}Terjemahkan ke Bahasa Inggris
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
              className="rounded-xl bg-cool px-5 py-3 font-sans text-sm font-semibold text-white hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 text-[0.6875rem] font-bold",
                  isCorrect ? "bg-reward text-white" : "bg-danger text-white",
                ].join(" ")}
              >
                {isCorrect ? "✓" : "✗"}
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
                <p className="font-mono text-[0.6875rem] text-muted mt-0.5">
                  Box direset ke 1
                </p>
              </div>
            )}

            {/* Info naik box saat benar */}
            {isCorrect && (
              <div className="rounded-xl bg-reward/8 border border-reward/20 px-4 py-3">
                <p className="font-sans text-sm font-semibold text-reward">
                  {card.word}
                </p>
                <p className="font-mono text-[0.6875rem] text-muted mt-0.5">
                  {card.box < 5
                    ? `Naik ke box ${newBox}`
                    : "Sudah di box 5 — hafalan terkuat!"}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              onKeyDown={handleNextKeyDown}
              disabled={isPending}
              className="w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors disabled:opacity-50"
            >
              {isPending
                ? "Menyimpan…"
                : currentIndex + 1 < cards.length
                ? "Lanjut →"
                : "Lihat hasil"}
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
