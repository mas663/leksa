"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import type { Card, WordForms } from "@/lib/cards";
import { BOX_INTERVALS } from "@/lib/leitner";
import Spinner from "@/components/Spinner";
import { editCardAction, regenCardAction, deleteCardAction, archiveCardAction, activateCardAction } from "./actions";

const INPUT =
  "w-full rounded-lg border border-line bg-field px-4 py-2.5 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cool transition-shadow";
const LABEL =
  "block font-mono text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink mb-1.5";

interface Fields {
  word: string;
  translation: string;
  partOfSpeech: string;
  exampleEN: string;
  exampleID: string;
  grammarNote: string;
}

function cardToFields(card: Card): Fields {
  return {
    word: card.word,
    translation: card.translation ?? "",
    partOfSpeech: card.part_of_speech ?? "",
    exampleEN: card.example_en ?? "",
    exampleID: card.example_id ?? "",
    grammarNote: card.grammar_note ?? "",
  };
}

function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

function IconSpeak() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v12a1 1 0 001 1h14a1 1 0 001-1V8" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  );
}

function IconActivate() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v12a1 1 0 001 1h14a1 1 0 001-1V8" />
      <polyline points="9 14 12 11 15 14" />
      <line x1="12" y1="11" x2="12" y2="17" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SourceBadge({ source }: { source: "ai" | "manual" }) {
  return (
    <span
      className={`inline-block font-mono text-[0.5625rem] leading-none px-1.5 py-0.5 rounded font-bold uppercase tracking-[0.08em] ${
        source === "ai"
          ? "bg-cool/10 text-cool"
          : "bg-ink/8 text-ink-soft"
      }`}
    >
      {source === "ai" ? "AI" : "Manual"}
    </span>
  );
}

interface EditDialogProps {
  card: Card;
  fields: Fields;
  isPending: boolean;
  onChange: (field: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSave: () => void;
  onClose: () => void;
}

function EditDialog({ card, fields, isPending, onChange, onSave, onClose }: EditDialogProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit kartu: ${card.word}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg my-8 rounded-2xl bg-card border border-line p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-sans text-lg font-semibold text-ink">Edit Kartu</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink active:scale-90 focus:outline-none focus:ring-2 focus:ring-cool rounded-lg p-1 transition"
            aria-label="Tutup"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div>
          <label htmlFor="edit-word" className={LABEL}>Kata (Inggris)</label>
          <input
            ref={firstInputRef}
            id="edit-word"
            type="text"
            required
            value={fields.word}
            onChange={onChange("word")}
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="edit-translation" className={LABEL}>Terjemahan</label>
          <input
            id="edit-translation"
            type="text"
            value={fields.translation}
            onChange={onChange("translation")}
            placeholder="mis. fana, tidak abadi"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="edit-pos" className={LABEL}>Kelas kata</label>
          <input
            id="edit-pos"
            type="text"
            value={fields.partOfSpeech}
            onChange={onChange("partOfSpeech")}
            placeholder="mis. adjective"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="edit-ex-en" className={LABEL}>Contoh kalimat (Inggris)</label>
          <textarea
            id="edit-ex-en"
            rows={2}
            value={fields.exampleEN}
            onChange={onChange("exampleEN")}
            placeholder="mis. The beauty of cherry blossoms is ephemeral."
            className={`${INPUT} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="edit-ex-id" className={LABEL}>Contoh kalimat (Indonesia)</label>
          <textarea
            id="edit-ex-id"
            rows={2}
            value={fields.exampleID}
            onChange={onChange("exampleID")}
            placeholder="mis. Keindahan bunga sakura itu fana."
            className={`${INPUT} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="edit-grammar" className={LABEL}>Catatan grammar</label>
          <textarea
            id="edit-grammar"
            rows={2}
            value={fields.grammarNote}
            onChange={onChange("grammarNote")}
            placeholder="mis. Digunakan sebagai predikatif atau atributif."
            className={`${INPUT} resize-none`}
          />
        </div>

        {card.word_forms && !card.word.includes(" ") && (
          <div className="rounded-lg border border-line bg-field px-4 py-3 space-y-1">
            <p className={LABEL}>
              {card.word_forms.type === "verb" ? "V1 · V2 · V3" : "Tunggal · Jamak"}
            </p>
            {card.word_forms.type === "verb" ? (
              <p className="font-mono text-sm text-ink-soft">
                {card.word_forms.v1}
                <span className="text-muted"> · </span>
                {card.word_forms.v2}
                <span className="text-muted"> · </span>
                {card.word_forms.v3}
              </p>
            ) : card.word_forms.type === "noun" ? (
              <p className="font-mono text-sm text-ink-soft">
                {card.word_forms.singular}
                <span className="text-muted"> · </span>
                {card.word_forms.plural}
              </p>
            ) : null}
          </div>
        )}

        <p className="font-mono text-[0.5625rem] text-muted">
          Menyimpan perubahan akan menandai kartu ini sebagai <strong className="text-ink-soft">Manual</strong>.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-line bg-field px-4 py-3 font-sans text-sm font-medium text-ink-soft hover:text-ink hover:border-ink/20 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!fields.word.trim() || isPending}
            className="flex-1 rounded-xl bg-cool px-4 py-3 font-sans text-sm font-semibold text-white hover:bg-cool-dark active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Spinner />}
            {isPending ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass = "bg-danger hover:bg-danger-dark focus:ring-danger",
  isPending,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card border border-line p-6 shadow-xl space-y-4">
        <h2 className="font-sans text-base font-semibold text-ink">{title}</h2>
        <p className="font-sans text-sm text-ink-soft leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-line bg-field px-4 py-3 font-sans text-sm font-medium text-ink-soft hover:text-ink hover:border-ink/20 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-cool transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 rounded-xl px-4 py-3 font-sans text-sm font-semibold text-white active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card transition disabled:opacity-40 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {isPending ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CardRowProps {
  card: Card;
  isRegenLoading: boolean;
  isArchiveLoading: boolean;
  onSpeak: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRegen: () => void;
  onArchive: () => void;
  onActivate: () => void;
}

function CardRow({ card, isRegenLoading, isArchiveLoading, onSpeak, onEdit, onDelete, onRegen, onArchive, onActivate }: CardRowProps) {
  return (
    <div className="py-4 flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans text-base font-semibold text-ink">{card.word}</span>
          {card.part_of_speech && (
            <span className="font-mono text-[0.5625rem] text-muted uppercase tracking-[0.06em] shrink-0">
              {card.part_of_speech}
            </span>
          )}
        </div>
        {card.translation && (
          <p className="font-sans text-sm text-ink-soft mt-0.5 leading-snug">{card.translation}</p>
        )}
        {card.word_forms && !card.word.includes(" ") && (
          <p className="font-mono text-[0.5625rem] text-muted mt-0.5">
            {card.word_forms.type === "verb"
              ? `Bentuk: ${card.word_forms.v1} · ${card.word_forms.v2} · ${card.word_forms.v3}`
              : card.word_forms.type === "noun"
              ? `Bentuk: ${card.word_forms.singular} · ${card.word_forms.plural}`
              : null}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-mono text-[0.5625rem] text-muted tabular-nums">
            Box {card.box}
            <span className="text-muted/60">
              {" · "}
              {BOX_INTERVALS[card.box] === 1 ? "ulang besok" : `ulang tiap ${BOX_INTERVALS[card.box]} hari`}
            </span>
          </span>
          <span className="text-line select-none">·</span>
          <SourceBadge source={card.source} />
          {card.is_active && (
            <button
              type="button"
              onClick={onRegen}
              disabled={isRegenLoading}
              className="font-mono text-[0.5625rem] text-cool hover:underline focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isRegenLoading ? (
                <>
                  <Spinner />
                  <span>Memuat…</span>
                </>
              ) : (
                "↻ Generate ulang"
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onSpeak}
          title={`Ucapkan "${card.word}"`}
          aria-label={`Ucapkan "${card.word}"`}
          className="p-2 rounded-lg text-muted hover:text-cool hover:bg-cool/8 active:scale-95 active:bg-cool/15 focus:outline-none focus:ring-2 focus:ring-cool transition"
        >
          <IconSpeak />
        </button>
        {card.is_active ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              title="Edit kartu"
              aria-label={`Edit kartu ${card.word}`}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-ink/5 active:scale-95 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-cool transition"
            >
              <IconEdit />
            </button>
            <button
              type="button"
              onClick={onArchive}
              disabled={isArchiveLoading}
              title="Arsipkan kartu"
              aria-label={`Arsipkan kartu ${card.word}`}
              className="p-2 rounded-lg text-muted hover:text-ink-soft hover:bg-ink/5 active:scale-95 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-cool transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isArchiveLoading ? <Spinner /> : <IconArchive />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Hapus kartu"
              aria-label={`Hapus kartu ${card.word}`}
              className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/8 active:scale-95 active:bg-danger/15 focus:outline-none focus:ring-2 focus:ring-danger transition"
            >
              <IconTrash />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onActivate}
              disabled={isArchiveLoading}
              title="Aktifkan lagi"
              aria-label={`Aktifkan lagi kartu ${card.word}`}
              className="p-2 rounded-lg text-muted hover:text-cool hover:bg-cool/8 active:scale-95 active:bg-cool/15 focus:outline-none focus:ring-2 focus:ring-cool transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isArchiveLoading ? <Spinner /> : <IconActivate />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Hapus kartu"
              aria-label={`Hapus kartu ${card.word}`}
              className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/8 active:scale-95 active:bg-danger/15 focus:outline-none focus:ring-2 focus:ring-danger transition"
            >
              <IconTrash />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-field border-b border-line">
      <p className="font-mono text-[0.5625rem] text-muted uppercase tracking-[0.12em]">
        {label}
      </p>
      <span className="font-mono text-[0.5625rem] text-muted tabular-nums">
        {count} kartu
      </span>
    </div>
  );
}

export default function CardsClient({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [search, setSearch] = useState("");
  const [archivedOpen, setArchivedOpen] = useState(false);

  // Edit dialog
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editFields, setEditFields] = useState<Fields>({
    word: "", translation: "", partOfSpeech: "", exampleEN: "", exampleID: "", grammarNote: "",
  });

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Generate ulang confirm (for manual source cards)
  const [regenTarget, setRegenTarget] = useState<Card | null>(null);

  // Per-card loading states
  const [regenLoadingId, setRegenLoadingId] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [archiveLoadingId, setArchiveLoadingId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.word.toLowerCase().includes(q) ||
        (c.translation?.toLowerCase().includes(q) ?? false)
    );
  }, [cards, search]);

  const activeCards = useMemo(() => filtered.filter((c) => c.is_active), [filtered]);
  const archivedCards = useMemo(() => filtered.filter((c) => !c.is_active), [filtered]);

  // Auto-expand archived section when search reveals archived results
  useEffect(() => {
    if (search && archivedCards.length > 0) setArchivedOpen(true);
  }, [search, archivedCards.length]);

  function openEdit(card: Card) {
    setEditCard(card);
    setEditFields(cardToFields(card));
  }

  function closeEdit() {
    setEditCard(null);
  }

  function handleEditChange(field: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditFields((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function handleSaveEdit() {
    if (!editCard || !editFields.word.trim()) return;
    const id = editCard.id;
    startTransition(async () => {
      const updated = await editCardAction(id, {
        word: editFields.word.trim(),
        translation: editFields.translation || null,
        part_of_speech: editFields.partOfSpeech || null,
        example_en: editFields.exampleEN || null,
        example_id: editFields.exampleID || null,
        grammar_note: editFields.grammarNote || null,
        word_forms: editCard.word_forms,
      });
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      closeEdit();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    startTransition(async () => {
      await deleteCardAction(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
    });
  }

  function handleRegenClick(card: Card) {
    setRegenError(null);
    if (card.source === "manual") {
      setRegenTarget(card);
    } else {
      doRegen(card);
    }
  }

  async function doRegen(card: Card) {
    setRegenTarget(null);
    setRegenLoadingId(card.id);
    setRegenError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: card.word }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenError(data.error ?? "Gagal generate ulang. Coba lagi.");
        setRegenLoadingId(null);
        return;
      }
      startTransition(async () => {
        const updated = await regenCardAction(card.id, {
          word: data.word ?? card.word,
          translation: data.translation ?? null,
          part_of_speech: data.partOfSpeech ?? null,
          example_en: data.exampleEN ?? null,
          example_id: data.exampleID ?? null,
          grammar_note: data.grammarNote ?? null,
          word_forms: (data.wordForms as WordForms) ?? null,
        });
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setRegenLoadingId(null);
      });
    } catch {
      setRegenError("Koneksi bermasalah. Coba lagi.");
      setRegenLoadingId(null);
    }
  }

  function handleArchive(card: Card) {
    setArchiveLoadingId(card.id);
    startTransition(async () => {
      const updated = await archiveCardAction(card.id);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setArchiveLoadingId(null);
    });
  }

  function handleActivate(card: Card) {
    setArchiveLoadingId(card.id);
    startTransition(async () => {
      const updated = await activateCardAction(card.id);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setArchiveLoadingId(null);
    });
  }

  const totalActive = cards.filter((c) => c.is_active).length;
  const totalArchived = cards.filter((c) => !c.is_active).length;

  return (
    <>
      {/* Regen error banner */}
      {regenError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 flex items-start justify-between gap-3"
        >
          <p className="font-sans text-sm text-danger">{regenError}</p>
          <button
            type="button"
            onClick={() => setRegenError(null)}
            className="text-danger/60 hover:text-danger focus:outline-none shrink-0"
            aria-label="Tutup pesan error"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-2">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
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
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kata atau terjemahan…"
          className="w-full rounded-xl border border-line bg-card pl-10 pr-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cool transition-shadow"
          aria-label="Cari kartu"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink focus:outline-none"
            aria-label="Hapus pencarian"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="font-mono text-[0.5625rem] text-muted uppercase tracking-[0.12em] mb-3 px-1">
        {search
          ? `${filtered.length} dari ${cards.length} kartu`
          : `${totalActive} aktif · ${totalArchived} diarsipkan`}
      </p>

      {/* Section: Sedang Dipelajari */}
      <div className="rounded-2xl bg-card border border-line overflow-hidden mb-3">
        <SectionHeader label="Sedang Dipelajari" count={activeCards.length} />
        <div className="divide-y divide-line">
          {activeCards.length === 0 ? (
            <div className="px-5 py-10 text-center">
              {cards.length === 0 ? (
                <>
                  <p className="font-sans text-sm text-ink-soft">Belum ada kartu.</p>
                  <p className="font-mono text-[0.5625rem] text-muted mt-1 uppercase tracking-widest">
                    Tambah kata pertamamu dari halaman Tambah Kata.
                  </p>
                </>
              ) : search ? (
                <p className="font-sans text-sm text-ink-soft">
                  Tidak ada kartu aktif yang cocok dengan &ldquo;{search}&rdquo;.
                </p>
              ) : (
                <p className="font-sans text-sm text-ink-soft">
                  Semua kartu sedang diarsipkan.
                </p>
              )}
            </div>
          ) : (
            activeCards.map((card) => (
              <div key={card.id} className="px-5">
                <CardRow
                  card={card}
                  isRegenLoading={regenLoadingId === card.id}
                  isArchiveLoading={archiveLoadingId === card.id}
                  onSpeak={() => speak(card.word)}
                  onEdit={() => openEdit(card)}
                  onDelete={() => setDeleteId(card.id)}
                  onRegen={() => handleRegenClick(card)}
                  onArchive={() => handleArchive(card)}
                  onActivate={() => handleActivate(card)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section: Diarsipkan */}
      <div className="rounded-2xl bg-card border border-line overflow-hidden">
        <button
          type="button"
          onClick={() => setArchivedOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 bg-field hover:bg-field/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cool transition-colors"
          aria-expanded={archivedOpen}
        >
          <p className="font-mono text-[0.5625rem] text-muted uppercase tracking-[0.12em]">
            Diarsipkan (Sudah Hafal)
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.5625rem] text-muted tabular-nums">
              {archivedCards.length} kartu
            </span>
            <span className="text-muted">
              <IconChevron open={archivedOpen} />
            </span>
          </div>
        </button>

        {archivedOpen && (
          <div className="divide-y divide-line border-t border-line">
            {archivedCards.length === 0 ? (
              <div className="px-5 py-10 text-center">
                {search ? (
                  <p className="font-sans text-sm text-ink-soft">
                    Tidak ada kartu arsip yang cocok dengan &ldquo;{search}&rdquo;.
                  </p>
                ) : (
                  <p className="font-sans text-sm text-ink-soft">
                    Belum ada kartu yang diarsipkan.
                  </p>
                )}
              </div>
            ) : (
              archivedCards.map((card) => (
                <div key={card.id} className="px-5 opacity-75">
                  <CardRow
                    card={card}
                    isRegenLoading={regenLoadingId === card.id}
                    isArchiveLoading={archiveLoadingId === card.id}
                    onSpeak={() => speak(card.word)}
                    onEdit={() => openEdit(card)}
                    onDelete={() => setDeleteId(card.id)}
                    onRegen={() => handleRegenClick(card)}
                    onArchive={() => handleArchive(card)}
                    onActivate={() => handleActivate(card)}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {editCard && (
        <EditDialog
          card={editCard}
          fields={editFields}
          isPending={isPending}
          onChange={handleEditChange}
          onSave={handleSaveEdit}
          onClose={closeEdit}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Hapus kartu?"
          message="Yakin ingin menghapus kartu ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          confirmClass="bg-danger hover:bg-danger-dark focus:ring-danger"
          isPending={isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      {/* Generate ulang confirm (manual cards) */}
      {regenTarget && (
        <ConfirmDialog
          title="Generate ulang?"
          message="Kartu ini sudah diedit manual. Generate ulang akan menimpa perubahanmu — lanjutkan?"
          confirmLabel="Ya, generate ulang"
          confirmClass="bg-cool hover:bg-cool-dark focus:ring-cool"
          isPending={false}
          onConfirm={() => doRegen(regenTarget)}
          onClose={() => setRegenTarget(null)}
        />
      )}
    </>
  );
}
