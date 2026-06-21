"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Card } from "@/lib/cards";
import { BOX_INTERVALS } from "@/lib/leitner";
import Flashcard from "@/components/Flashcard";

interface StudyClientProps {
  cards: Card[];
  mode?: "normal" | "review";
}

function BoxInfo({ box }: { box: number }) {
  return (
    <p className="font-mono text-[0.6875rem] text-muted text-center tracking-[0.08em]">
      Box {box} dari 5 · ulang tiap {BOX_INTERVALS[box] ?? 1} hari
      {box === 5 && <span className="text-reward"> · hafalan terkuat</span>}
    </p>
  );
}

export default function StudyClient({ cards, mode = "normal" }: StudyClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (cards.length === 0) {
    if (mode === "review") {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <p className="font-sans text-base text-ink-soft">
            Tidak ada kartu aktif untuk ditinjau.
          </p>
          <p className="font-sans text-sm text-muted">
            Tambah kata baru untuk mulai belajar.
          </p>
          <Link
            href="/add?from=/study"
            className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
          >
            + Tambah kata
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="font-sans text-base text-ink-soft">
          Tidak ada kartu jatuh tempo.
        </p>
        <p className="font-sans text-sm text-muted">
          Kembali lagi nanti setelah interval berlalu.
        </p>
        <div className="mt-2">
          <Link
            href="/quiz/practice"
            className="rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition block"
          >
            Latihan Kuis
          </Link>
        </div>
      </div>
    );
  }

  const done = currentIndex >= cards.length;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-2xl bg-card border border-line p-8 w-full">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-3">
            Tinjauan selesai
          </p>
          <p className="font-sans text-3xl font-semibold text-ink mb-1">
            Kerja bagus!
          </p>
          <p className="font-sans text-sm text-ink-soft mb-6 leading-relaxed">
            Kamu sudah meninjau {cards.length} kartu.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/quiz"
              className="block w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition"
            >
              Uji Pemahaman dengan Kuis
            </Link>
            <Link
              href="/"
              className="block w-full rounded-xl border border-cool/40 bg-cool/5 px-4 py-3 font-sans text-sm font-semibold text-cool text-center hover:bg-cool/10 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em]">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Kartu */}
      <Flashcard
        key={card.id}
        card={card}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((f) => !f)}
      />

      {/* Info box kartu saat ini (read-only) */}
      <BoxInfo box={card.box} />

      {/* Navigasi */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={isFirst}
          className="flex-1 rounded-xl border border-line bg-card px-4 py-3.5 font-sans text-sm font-semibold text-ink-soft hover:border-ink/20 hover:text-ink active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Sebelumnya
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="flex-1 rounded-xl bg-cool px-4 py-3.5 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition"
        >
          {isLast ? "Selesai" : "Selanjutnya →"}
        </button>
      </div>
    </div>
  );
}
