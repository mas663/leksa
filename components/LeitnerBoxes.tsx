"use client";

import { useState, useEffect } from "react";

interface BoxCard {
  id: string;
  word: string;
  translation: string | null;
}

interface LeitnerBoxesProps {
  byBox: Record<number, number>;
  total: number;
  boxCards: Record<number, BoxCard[]>;
}

const BOX_DESCRIPTIONS: Record<number, string> = {
  1: "Paling sering diulang · interval 1 hari",
  2: "Interval 2 hari",
  3: "Interval 4 hari",
  4: "Interval 8 hari",
  5: "Sudah paling hafal · interval 16 hari",
};

export default function LeitnerBoxes({ byBox, total, boxCards }: LeitnerBoxesProps) {
  const [openBox, setOpenBox] = useState<number | null>(null);

  useEffect(() => {
    if (openBox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenBox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openBox]);

  const maxCount = Math.max(...Object.values(byBox), 1);

  return (
    <>
      <div className="rounded-2xl bg-card border border-line p-5">
        <div className="mb-3">
          <p className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em]">
            Sebaran Box Leitner
          </p>
          <p className="font-sans text-[0.6875rem] text-muted mt-1 leading-snug">
            Box 1 = paling sering diulang &middot; Box 5 = sudah paling kamu hafal
          </p>
        </div>
        <div className="flex gap-2 items-end">
          {[1, 2, 3, 4, 5].map((box) => {
            const count = byBox[box] ?? 0;
            const heightPct =
              total === 0 ? 0 : Math.round((count / maxCount) * 100);
            return (
              <button
                key={box}
                type="button"
                onClick={() => count > 0 && setOpenBox(box)}
                disabled={count === 0}
                className="flex-1 flex flex-col items-center gap-1.5 focus:outline-none group"
                aria-label={`Box ${box}: ${count} kartu${count > 0 ? ", klik untuk lihat kata" : ""}`}
              >
                <div
                  className={[
                    "w-full rounded-lg border flex items-center justify-center transition-colors",
                    count > 0
                      ? "bg-field border-line group-hover:bg-cool/8 group-hover:border-cool/40 group-focus:ring-2 group-focus:ring-cool cursor-pointer"
                      : "bg-field border-line opacity-40 cursor-default",
                  ].join(" ")}
                  style={{ height: `${Math.max(heightPct * 0.72 + 28, 48)}px` }}
                >
                  <span className="font-mono text-sm font-bold text-muted tabular-nums">
                    {count}
                  </span>
                </div>
                <span className="font-mono text-[0.625rem] text-muted">{box}</span>
              </button>
            );
          })}
        </div>
        {total > 0 && (
          <p className="font-mono text-[0.5625rem] text-muted mt-3 text-center tracking-[0.06em]">
            Klik box untuk melihat kata-kata di dalamnya
          </p>
        )}
      </div>

      {openBox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Kata di Box ${openBox}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenBox(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-card border border-line shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <p className="font-sans text-base font-semibold text-ink">
                  Box {openBox}
                </p>
                <p className="font-mono text-[0.5625rem] text-muted mt-0.5">
                  {BOX_DESCRIPTIONS[openBox]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenBox(null)}
                className="text-muted hover:text-ink active:scale-90 focus:outline-none focus:ring-2 focus:ring-cool rounded-lg p-1 transition"
                aria-label="Tutup"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {(boxCards[openBox] ?? []).length === 0 ? (
                <p className="px-5 py-8 text-center font-sans text-sm text-muted">
                  Tidak ada kartu di box ini.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {(boxCards[openBox] ?? []).map((card) => (
                    <li
                      key={card.id}
                      className="px-5 py-3 flex items-baseline gap-2"
                    >
                      <span className="font-sans text-sm font-semibold text-ink shrink-0">
                        {card.word}
                      </span>
                      {card.translation && (
                        <span className="font-sans text-xs text-ink-soft truncate">
                          {card.translation}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
