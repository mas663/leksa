"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { createCard, checkCardExists } from "@/app/add/actions";
import type { WordForms } from "@/lib/cards";

type Mode = "ai" | "manual";

interface Fields {
  word: string;
  translation: string;
  partOfSpeech: string;
  exampleEN: string;
  exampleID: string;
  grammarNote: string;
  wordForms: WordForms;
}

const EMPTY: Fields = {
  word: "",
  translation: "",
  partOfSpeech: "",
  exampleEN: "",
  exampleID: "",
  grammarNote: "",
  wordForms: null,
};

const INPUT =
  "w-full rounded-lg border border-line bg-card px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cool transition-shadow";
const INPUT_MONO =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cool transition-shadow";
const LABEL =
  "block font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink mb-2";

function capitalizeFirst(s: string): string {
  const t = s.trim();
  if (!t) return s;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function CardForm() {
  const [mode, setMode] = useState<Mode>("ai");
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [source, setSource] = useState<"ai" | "manual">("manual");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genDuplicate, setGenDuplicate] = useState(false);
  const [saveDuplicate, setSaveDuplicate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showAllFields = mode === "manual" || aiGenerated;

  const posLower = fields.partOfSpeech.toLowerCase().trim();
  const wordIsPhrase = fields.word.trim().includes(" ");
  const showVerbForms = !wordIsPhrase && /\bverb\b/.test(posLower);
  const showNounForms = !wordIsPhrase && /\bnoun\b/.test(posLower);

  const handleGenerate = async () => {
    const trimmedWord = fields.word.trim();
    if (!trimmedWord || isGenerating) return;

    setIsGenerating(true);
    setGenError(null);
    setGenDuplicate(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: trimmedWord }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setGenDuplicate(true);
        } else {
          setGenError(data.error ?? "Gagal generate. Coba isi manual.");
        }
        return;
      }

      setFields((prev) => ({
        word: data.word ?? prev.word,
        translation: data.translation ?? "",
        partOfSpeech: data.partOfSpeech ?? "",
        exampleEN: data.exampleEN ?? "",
        exampleID: data.exampleID ?? "",
        grammarNote: data.grammarNote ?? "",
        wordForms: data.wordForms ?? null,
      }));
      setSource("ai");
      setAiGenerated(true);
    } catch {
      setGenError("Koneksi bermasalah. Coba isi manual.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, word: e.target.value }));
    if (aiGenerated) setSource("manual");
    setGenError(null);
    setGenDuplicate(false);
    setSaveDuplicate(false);
  };

  const updateField =
    (field: Exclude<keyof Fields, "word" | "partOfSpeech" | "wordForms">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
      if (aiGenerated) setSource("manual");
    };

  const handlePartOfSpeechChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFields((prev) => {
      const pos = value.toLowerCase().trim();
      const nextIsVerb = /\bverb\b/.test(pos);
      const nextIsNoun = /\bnoun\b/.test(pos);
      // Clear wordForms when partOfSpeech switches away from its current type
      const clearForms =
        (prev.wordForms?.type === "verb" && !nextIsVerb) ||
        (prev.wordForms?.type === "noun" && !nextIsNoun);
      return { ...prev, partOfSpeech: value, wordForms: clearForms ? null : prev.wordForms };
    });
    if (aiGenerated) setSource("manual");
  };

  const updateVerbForm =
    (key: "v1" | "v2" | "v3") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFields((prev) => ({
        ...prev,
        wordForms: {
          type: "verb",
          v1: prev.wordForms?.type === "verb" ? prev.wordForms.v1 : "",
          v2: prev.wordForms?.type === "verb" ? prev.wordForms.v2 : "",
          v3: prev.wordForms?.type === "verb" ? prev.wordForms.v3 : "",
          [key]: value,
        },
      }));
      if (aiGenerated) setSource("manual");
    };

  const updateNounForm =
    (key: "singular" | "plural") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFields((prev) => ({
        ...prev,
        wordForms: {
          type: "noun",
          singular: prev.wordForms?.type === "noun" ? prev.wordForms.singular : "",
          plural: prev.wordForms?.type === "noun" ? prev.wordForms.plural : "",
          [key]: value,
        },
      }));
      if (aiGenerated) setSource("manual");
    };

  const handleWordBlur = () => {
    setFields((prev) => {
      const capitalized = capitalizeFirst(prev.word);
      return capitalized !== prev.word ? { ...prev, word: capitalized } : prev;
    });
  };

  // Guard: in AI mode, only allow save after generation has run
  const canSave = mode === "manual" || aiGenerated;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSave) return;

    // Capitalize word as fallback (in case blur didn't fire)
    const finalWord = capitalizeFirst(fields.word);

    // Pre-save duplicate check (defense in depth)
    setSaveDuplicate(false);
    const exists = await checkCardExists(finalWord);
    if (exists) {
      setSaveDuplicate(true);
      return;
    }

    // Trim word form values and discard if all empty
    let finalWordForms: WordForms = null;
    if (fields.wordForms?.type === "verb") {
      const v1 = fields.wordForms.v1.trim();
      const v2 = fields.wordForms.v2.trim();
      const v3 = fields.wordForms.v3.trim();
      if (v1 || v2 || v3) finalWordForms = { type: "verb", v1, v2, v3 };
    } else if (fields.wordForms?.type === "noun") {
      const singular = fields.wordForms.singular.trim();
      const plural = fields.wordForms.plural.trim();
      if (singular || plural) finalWordForms = { type: "noun", singular, plural };
    }

    const fd = new FormData();
    fd.set("word", finalWord);
    fd.set("translation", fields.translation);
    fd.set("part_of_speech", fields.partOfSpeech);
    fd.set("example_en", fields.exampleEN);
    fd.set("example_id", fields.exampleID);
    fd.set("grammar_note", fields.grammarNote);
    fd.set("word_forms", finalWordForms ? JSON.stringify(finalWordForms) : "");
    fd.set("source", source);
    startTransition(async () => {
      const result = await createCard(fd);
      if (result?.error === "duplicate") setSaveDuplicate(true);
    });
  };

  // In AI mode, Enter on the word input triggers generate instead of form submit
  const handleWordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mode === "ai" && !aiGenerated) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const verbV1 = fields.wordForms?.type === "verb" ? fields.wordForms.v1 : "";
  const verbV2 = fields.wordForms?.type === "verb" ? fields.wordForms.v2 : "";
  const verbV3 = fields.wordForms?.type === "verb" ? fields.wordForms.v3 : "";
  const nounSingular = fields.wordForms?.type === "noun" ? fields.wordForms.singular : "";
  const nounPlural = fields.wordForms?.type === "noun" ? fields.wordForms.plural : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-line bg-panel p-1 gap-1">
        {(["ai", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2.5 font-sans text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cool focus:ring-inset active:scale-[0.97] ${
              mode === m
                ? "bg-card text-ink shadow-sm"
                : "text-muted hover:text-ink-soft hover:bg-card/60"
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
          onChange={handleWordChange}
          onBlur={handleWordBlur}
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
            className="w-full rounded-lg bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating && <Spinner />}
            {isGenerating ? "Membuat kartu…" : "Generate (AI)"}
          </button>

          {genDuplicate && (
            <div
              role="alert"
              className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 space-y-2"
            >
              <p className="font-sans text-sm text-danger">
                Kata ini sudah ada di kartu kamu.
              </p>
              <Link
                href="/cards"
                className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
              >
                Lihat di Kelola Kartu →
              </Link>
            </div>
          )}

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
              onChange={handlePartOfSpeechChange}
              placeholder="mis. adjective"
              className={INPUT}
            />
          </div>

          {/* Verb forms — muncul saat kelas kata mengandung "verb" */}
          {showVerbForms && (
            <div>
              <p className={LABEL}>
                Bentuk kata
                <span className="font-mono text-[0.5625rem] text-muted ml-1.5 normal-case tracking-normal font-normal">
                  V1 · V2 · V3
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    value={verbV1}
                    onChange={updateVerbForm("v1")}
                    placeholder="run"
                    aria-label="V1 — infinitif"
                    className={INPUT_MONO}
                  />
                  <p className="font-mono text-[0.5rem] text-muted mt-1 text-center uppercase tracking-[0.12em]">V1</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={verbV2}
                    onChange={updateVerbForm("v2")}
                    placeholder="ran"
                    aria-label="V2 — past tense"
                    className={INPUT_MONO}
                  />
                  <p className="font-mono text-[0.5rem] text-muted mt-1 text-center uppercase tracking-[0.12em]">V2</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={verbV3}
                    onChange={updateVerbForm("v3")}
                    placeholder="run"
                    aria-label="V3 — past participle"
                    className={INPUT_MONO}
                  />
                  <p className="font-mono text-[0.5rem] text-muted mt-1 text-center uppercase tracking-[0.12em]">V3</p>
                </div>
              </div>
            </div>
          )}

          {/* Noun forms — muncul saat kelas kata mengandung "noun" */}
          {showNounForms && (
            <div>
              <p className={LABEL}>
                Bentuk kata
                <span className="font-mono text-[0.5625rem] text-muted ml-1.5 normal-case tracking-normal font-normal">
                  tunggal · jamak
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={nounSingular}
                    onChange={updateNounForm("singular")}
                    placeholder="cat"
                    aria-label="Tunggal (singular)"
                    className={INPUT_MONO}
                  />
                  <p className="font-mono text-[0.5rem] text-muted mt-1 text-center uppercase tracking-[0.12em]">Tunggal</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={nounPlural}
                    onChange={updateNounForm("plural")}
                    placeholder="cats"
                    aria-label="Jamak (plural)"
                    className={INPUT_MONO}
                  />
                  <p className="font-mono text-[0.5rem] text-muted mt-1 text-center uppercase tracking-[0.12em]">Jamak</p>
                </div>
              </div>
            </div>
          )}

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
                  className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline disabled:opacity-40 flex items-center gap-1"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size={11} />
                      <span>Memuat…</span>
                    </>
                  ) : (
                    "↻ Generate ulang"
                  )}
                </button>
              </div>

              {genDuplicate && (
                <div
                  role="alert"
                  className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 space-y-2"
                >
                  <p className="font-sans text-sm text-danger">
                    Kata ini sudah ada di kartu kamu.
                  </p>
                  <Link
                    href="/cards"
                    className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
                  >
                    Lihat di Kelola Kartu →
                  </Link>
                </div>
              )}

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

          {saveDuplicate && (
            <div
              role="alert"
              className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 space-y-2"
            >
              <p className="font-sans text-sm text-danger">
                Kata ini sudah ada di kartu kamu.
              </p>
              <Link
                href="/cards"
                className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-cool hover:underline focus:outline-none focus:underline"
              >
                Lihat di Kelola Kartu →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={!fields.word.trim() || isPending}
            className="w-full rounded-lg bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Spinner />}
            {isPending ? "Menyimpan…" : "Simpan Kartu"}
          </button>
        </>
      )}
    </form>
  );
}
