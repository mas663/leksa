"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Card } from "@/lib/cards";
import { advanceBox, BOX_INTERVALS } from "@/lib/leitner";
import Flashcard from "@/components/Flashcard";
import Spinner from "@/components/Spinner";
import { markKnown, markWrong } from "./actions";

interface StudyClientProps {
  cards: Card[];
  mode?: "normal" | "review";
}

function LeitnerPath({ currentBox }: { currentBox: number }) {
  return (
    <div
      className="flex items-center justify-center"
      aria-label={`Posisi saat ini: box ${currentBox} dari 5`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((box, i) => (
        <div key={box} className="flex items-center">
          {i > 0 && (
            <div
              className="w-8 h-px"
              style={{
                background:
                  box <= currentBox
                    ? "var(--accent-cool)"
                    : "var(--line)",
              }}
            />
          )}
          <div
            className={[
              "w-3.5 h-3.5 rounded-full border-2 transition-colors",
              box < currentBox
                ? "bg-cool border-cool"
                : box === currentBox
                ? "bg-cool border-cool ring-2 ring-cool ring-offset-2 ring-offset-field"
                : "bg-transparent border-muted/50",
            ].join(" ")}
          />
        </div>
      ))}
    </div>
  );
}

function BoxLabel({ box }: { box: number }) {
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
  const [session, setSession] = useState({ known: 0, missed: 0 });
  const [justMastered, setJustMastered] = useState(false);
  const [justKnownBox, setJustKnownBox] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset flip dan feedback saat ganti kartu
  useEffect(() => {
    setIsFlipped(false);
    setJustKnownBox(null);
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
            href="/add?from=/study/practice"
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
        <div className="flex flex-col items-stretch w-full max-w-65 gap-3 mt-2">
          <Link
            href="/study/practice"
            className="rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition"
          >
            Tinjau Semua Kartu
          </Link>
          <Link
            href="/quiz/practice"
            className="rounded-xl border border-cool/40 bg-cool/5 px-4 py-3 font-sans text-sm font-semibold text-cool text-center hover:bg-cool/10 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition"
          >
            Latihan Kuis
          </Link>
        </div>
        <Link
          href="/"
          className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted hover:text-ink focus:outline-none focus:underline"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const done = currentIndex >= cards.length;

  if (done) {
    const total = session.known + session.missed;
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-2xl bg-card border border-line p-8 w-full">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] mb-3">
            Sesi selesai
          </p>
          <p className="font-sans text-3xl font-semibold text-ink mb-1">
            Kerja bagus!
          </p>
          <p className="font-sans text-sm text-ink-soft mb-1 leading-relaxed">
            Kamu sudah mengulas {total} kartu dalam sesi ini.
          </p>
          {mode === "review" && (
            <p className="font-mono text-[0.5625rem] text-muted mb-5">
              Jawaban tidak memengaruhi jadwal Leitner kamu.
            </p>
          )}
          {mode === "normal" && <div className="mb-5" />}

          <div className="flex gap-6 mb-6">
            <div className="flex-1 rounded-xl bg-cool/8 border border-cool/20 px-4 py-4 text-center">
              <p className="font-mono text-3xl font-bold text-cool tabular-nums">
                {session.known}
              </p>
              <p className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em] mt-1">
                Tahu
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-danger/5 border border-danger/20 px-4 py-4 text-center">
              <p className="font-mono text-3xl font-bold text-danger tabular-nums">
                {session.missed}
              </p>
              <p className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em] mt-1">
                Belum hafal
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white text-center hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  function handleKnown() {
    if (isPending) return;
    if (mode === "normal") {
      const newBox = advanceBox(card.box);
      setJustKnownBox(newBox);
      if (card.box < 5 && newBox === 5) {
        setJustMastered(true);
        setTimeout(() => setJustMastered(false), 900);
      }
      startTransition(async () => {
        await markKnown(card.id, card.box, card.times_correct);
        setSession((s) => ({ ...s, known: s.known + 1 }));
        setCurrentIndex((i) => i + 1);
      });
    } else {
      setSession((s) => ({ ...s, known: s.known + 1 }));
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleMissed() {
    if (isPending) return;
    if (mode === "normal") {
      startTransition(async () => {
        await markWrong(card.id, card.times_wrong);
        setSession((s) => ({ ...s, missed: s.missed + 1 }));
        setCurrentIndex((i) => i + 1);
      });
    } else {
      setSession((s) => ({ ...s, missed: s.missed + 1 }));
      setCurrentIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.12em]">
          {currentIndex + 1} / {cards.length}
        </p>
        <div className="flex gap-3">
          {session.known > 0 && (
            <span className="font-mono text-[0.625rem] text-cool tabular-nums">
              {session.known} tahu
            </span>
          )}
          {session.missed > 0 && (
            <span className="font-mono text-[0.625rem] text-danger tabular-nums">
              {session.missed} belum
            </span>
          )}
        </div>
      </div>

      {/* Kartu */}
      <div
        className={
          justMastered && mode === "normal"
            ? "rounded-2xl ring-2 ring-reward transition-all"
            : "rounded-2xl"
        }
      >
        <Flashcard
          key={card.id}
          card={card}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((f) => !f)}
        />
      </div>

      {/* Jalur Leitner */}
      <div className="flex flex-col gap-1.5">
        <LeitnerPath currentBox={card.box} />
        <BoxLabel box={card.box} />
      </div>

      {/* Tombol aksi */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleMissed}
          disabled={isPending}
          className="flex-1 rounded-xl border border-line bg-card px-4 py-3.5 font-sans text-sm font-semibold text-ink-soft hover:border-danger/40 hover:text-danger hover:bg-danger/5 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-field transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Belum hafal
        </button>
        <button
          type="button"
          onClick={handleKnown}
          disabled={isPending}
          className="flex-1 rounded-xl bg-cool px-4 py-3.5 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-field transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && mode === "normal" && <Spinner />}
          {isPending && mode === "normal" ? "Menyimpan…" : "Tahu"}
        </button>
      </div>

      {/* Feedback setelah klik Tahu — hanya di mode normal */}
      {mode === "normal" && justKnownBox !== null && (
        <p className="font-mono text-[0.5625rem] text-cool text-center tracking-[0.06em]">
          {justKnownBox > card.box
            ? `Naik ke Box ${justKnownBox} — muncul lagi dalam ${BOX_INTERVALS[justKnownBox]} hari`
            : "Sudah di Box 5 — hafalan terkuat!"}
        </p>
      )}
    </div>
  );
}
