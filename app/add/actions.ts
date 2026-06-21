"use server";

import { addCard } from "@/lib/cards";
import type { WordForms } from "@/lib/cards";
import { redirect } from "next/navigation";

export async function createCard(formData: FormData) {
  const word = (formData.get("word") as string | null)?.trim() ?? "";
  if (!word) throw new Error("Kata tidak boleh kosong");

  const rawSource = formData.get("source");
  const rawWordForms = (formData.get("word_forms") as string | null) || "";

  let word_forms: WordForms = null;
  if (rawWordForms) {
    try {
      word_forms = JSON.parse(rawWordForms) as WordForms;
    } catch {
      word_forms = null;
    }
  }

  await addCard({
    word,
    translation: (formData.get("translation") as string) || null,
    part_of_speech: (formData.get("part_of_speech") as string) || null,
    example_en: (formData.get("example_en") as string) || null,
    example_id: (formData.get("example_id") as string) || null,
    grammar_note: (formData.get("grammar_note") as string) || null,
    word_forms,
    source: rawSource === "ai" ? "ai" : "manual",
  });

  redirect("/");
}
