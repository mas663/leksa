"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/cards";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M10 3.75a.75.75 0 0 0-1.264-.546L4.703 7H3.167a.75.75 0 0 0-.7.48A6.985 6.985 0 0 0 2 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0 0 10 16.25V3.75ZM15.95 5.05a.75.75 0 0 0-1.06 1.061 5.5 5.5 0 0 1 0 7.778.75.75 0 0 0 1.06 1.06 7 7 0 0 0 0-9.899ZM13.829 7.172a.75.75 0 0 0-1.061 1.06 2.5 2.5 0 0 1 0 3.536.75.75 0 0 0 1.06 1.06 4 4 0 0 0 0-5.656Z" />
    </svg>
  );
}

function speak(word: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export default function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFlip();
    }
  }

  const flipContainerStyle = reducedMotion
    ? {}
    : {
        transformStyle: "preserve-3d" as const,
        transition: "transform 0.4s cubic-bezier(0.2,0.8,0.2,1)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      };

  const faceHiddenStyle = reducedMotion
    ? {}
    : {
        backfaceVisibility: "hidden" as const,
        WebkitBackfaceVisibility: "hidden" as const,
      };

  const frontOpacity = reducedMotion
    ? { opacity: isFlipped ? 0 : 1, transition: "opacity 0.15s", pointerEvents: (isFlipped ? "none" : "auto") as React.CSSProperties["pointerEvents"] }
    : {};

  const backOpacity = reducedMotion
    ? { opacity: isFlipped ? 1 : 0, transition: "opacity 0.15s", pointerEvents: (isFlipped ? "auto" : "none") as React.CSSProperties["pointerEvents"] }
    : { transform: "rotateY(180deg)" };

  return (
    <div
      className="relative w-full"
      style={{ minHeight: "300px", perspective: "1200px" }}
    >
      <div
        className="relative w-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cool"
        style={{ minHeight: "300px", ...flipContainerStyle }}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? "Tampilkan depan kartu" : "Klik untuk lihat arti"}
        aria-pressed={isFlipped}
      >
        {/* Depan */}
        <div
          className="absolute inset-0 rounded-2xl bg-card border border-line p-8 flex flex-col items-center justify-center gap-3"
          style={{ ...faceHiddenStyle, ...frontOpacity }}
        >
          <p className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em]">
            klik untuk lihat arti
          </p>
          <h2
            className="font-sans font-semibold text-ink text-center"
            style={{
              fontSize: "clamp(2.25rem, 7vw, 3.5rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {card.word}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speak(card.word);
            }}
            disabled={!canSpeak}
            className="mt-1 rounded-full p-2 text-muted hover:text-cool hover:bg-cool/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cool transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Lafalkan kata"
          >
            <SpeakerIcon />
          </button>
        </div>

        {/* Belakang */}
        <div
          className="absolute inset-0 rounded-2xl bg-card border border-line p-8 flex flex-col justify-center gap-3 overflow-y-auto"
          style={{ ...faceHiddenStyle, ...backOpacity }}
        >
          {card.part_of_speech && (
            <span className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em]">
              {card.part_of_speech}
            </span>
          )}
          <p className="font-sans text-2xl font-semibold text-ink leading-snug">
            {card.translation ?? "—"}
          </p>
          {card.example_en && (
            <p className="font-serif text-sm text-ink-soft leading-relaxed italic">
              &ldquo;{card.example_en}&rdquo;
            </p>
          )}
          {card.example_id && (
            <p className="font-serif text-sm text-muted leading-relaxed">
              &ldquo;{card.example_id}&rdquo;
            </p>
          )}
          {card.word_forms && !card.word.includes(" ") && (
            <div className="border-t border-line pt-3 mt-1 flex flex-col gap-1">
              <span className="font-mono text-[0.6875rem] text-muted uppercase tracking-[0.12em]">
                {card.word_forms.type === "verb" ? "V1 · V2 · V3" : "Tunggal · Jamak"}
              </span>
              <p className="font-mono text-sm text-ink-soft">
                {card.word_forms.type === "verb"
                  ? `${card.word_forms.v1} · ${card.word_forms.v2} · ${card.word_forms.v3}`
                  : `${card.word_forms.singular} · ${card.word_forms.plural}`}
              </p>
            </div>
          )}
          {card.grammar_note && (
            <p className="font-mono text-xs text-muted leading-relaxed border-t border-line pt-3 mt-1">
              {card.grammar_note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
