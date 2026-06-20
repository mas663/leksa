"use client";

import { useState, useTransition } from "react";
import { createCard } from "@/app/add/actions";

type Mode = "ai" | "manual";

interface Fields {
  word: string;
  translation: string;
  partOfSpeech: string;
  exampleEN: string;
  exampleID: string;
  grammarNote: string;
}

const EMPTY: Fields = {
  word: "",
  translation: "",
  partOfSpeech: "",
  exampleEN: "",
  exampleID: "",
  grammarNote: "",
};

const INPUT =
  "w-full rounded-lg border border-line bg-card px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cool transition-shadow";
const LABEL =
  "block font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink mb-2";

export default function CardForm() {
  const [mode, setMode] = useState<Mode>("ai");
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [source, setSource] = useState<"ai" | "manual">("manual");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showAllFields = mode === "manual" || aiGenerated;

  const handleGenerate = async () => {
    const trimmedWord = fields.word.trim();
    if (!trimmedWord || isGenerating) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: trimmedWord }),
      });
      const data = await res.json();

      if (!res.ok) {
        setGenError(data.error ?? "Gagal generate. Coba isi manual.");
        return;
      }

      setFields((prev) => ({
        word: prev.word,
        translation: data.translation ?? "",
        partOfSpeech: data.partOfSpeech ?? "",
        exampleEN: data.exampleEN ?? "",
        exampleID: data.exampleID ?? "",
        grammarNote: data.grammarNote ?? "",
      }));
      setSource("ai");
      setAiGenerated(true);
    } catch {
      setGenError("Koneksi bermasalah. Coba isi manual.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField =
    (field: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
      if (aiGenerated) setSource("manual");
    };

  // Guard: in AI mode, only allow save after generation has run
  const canSave = mode === "manual" || aiGenerated;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSave) return;
    const fd = new FormData();
    fd.set("word", fields.word.trim());
    fd.set("translation", fields.translation);
    fd.set("part_of_speech", fields.partOfSpeech);
    fd.set("example_en", fields.exampleEN);
    fd.set("example_id", fields.exampleID);
    fd.set("grammar_note", fields.grammarNote);
    fd.set("source", source);
    startTransition(() => {
      createCard(fd);
    });
  };

  // In AI mode, Enter on the word input triggers generate instead of form submit
  const handleWordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mode === "ai" && !aiGenerated) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-line bg-panel p-1 gap-1">
        {(["ai", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2.5 font-sans text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cool focus:ring-inset ${
              mode === m
                ? "bg-card text-ink shadow-sm"
                : "text-muted hover:text-ink-soft"
            }`}
          >
            {m === "ai" ? "Generate AI" : "Isi Manual"}
          </button>
        ))}
      </div>

      {/* Word */}
      <div>
        <label htmlFor="word" className={LABEL}>
          Kata (Inggris)
        </label>
        <input
          id="word"
          type="text"
          required
          autoFocus
          value={fields.word}
          onChange={updateField("word")}
          onKeyDown={handleWordKeyDown}
          placeholder="mis. ephemeral"
          className={INPUT}
        />
      </div>

      {/* AI: generate button (before first generation) */}
      {mode === "ai" && !aiGenerated && (
        <>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!fields.word.trim() || isGenerating}
            className="w-full rounded-lg bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Membuat kartu…" : "Generate (AI)"}
          </button>

          {genError && (
            <div
              role="alert"
              className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 space-y-2"
            >
              <p className="font-sans text-sm text-danger">{genError}</p>
              <button
                type="button"
                onClick={() => {
                  setMode("manual");
                  setGenError(null);
                }}
                className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
              >
                Isi manual sebagai gantinya →
              </button>
            </div>
          )}
        </>
      )}

      {/* All detail fields */}
      {showAllFields && (
        <>
          {/* Divider with source badge */}
          {aiGenerated && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[0.625rem] text-muted uppercase tracking-[0.15em] shrink-0">
                {source === "ai" ? "Dibuat AI" : "Diedit manual"}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
          )}

          <div>
            <label htmlFor="translation" className={LABEL}>
              Terjemahan
            </label>
            <input
              id="translation"
              type="text"
              value={fields.translation}
              onChange={updateField("translation")}
              placeholder="mis. fana, tidak abadi"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="partOfSpeech" className={LABEL}>
              Kelas kata
            </label>
            <input
              id="partOfSpeech"
              type="text"
              value={fields.partOfSpeech}
              onChange={updateField("partOfSpeech")}
              placeholder="mis. adjective"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="exampleEN" className={LABEL}>
              Contoh kalimat (Inggris)
            </label>
            <textarea
              id="exampleEN"
              rows={2}
              value={fields.exampleEN}
              onChange={updateField("exampleEN")}
              placeholder="mis. The beauty of cherry blossoms is ephemeral."
              className={`${INPUT} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="exampleID" className={LABEL}>
              Contoh kalimat (Indonesia)
            </label>
            <textarea
              id="exampleID"
              rows={2}
              value={fields.exampleID}
              onChange={updateField("exampleID")}
              placeholder="mis. Keindahan bunga sakura itu fana."
              className={`${INPUT} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="grammarNote" className={LABEL}>
              Catatan grammar
            </label>
            <textarea
              id="grammarNote"
              rows={2}
              value={fields.grammarNote}
              onChange={updateField("grammarNote")}
              placeholder="mis. Digunakan sebagai predikatif atau atributif."
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* AI mode: re-generate + error after first generation */}
          {mode === "ai" && aiGenerated && (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!fields.word.trim() || isGenerating}
                  className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline disabled:opacity-40"
                >
                  {isGenerating ? "Memuat…" : "↻ Generate ulang"}
                </button>
              </div>

              {genError && (
                <p
                  role="alert"
                  className="font-sans text-sm text-danger rounded-lg bg-danger/5 border border-danger/20 px-4 py-3"
                >
                  {genError}
                </p>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={!fields.word.trim() || isPending}
            className="w-full rounded-lg bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool/90 focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Menyimpan…" : "Simpan Kartu"}
          </button>
        </>
      )}
    </form>
  );
}
