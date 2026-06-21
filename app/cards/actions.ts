"use server";

import { updateCard, deleteCard } from "@/lib/cards";
import { revalidatePath } from "next/cache";
import type { Card, WordForms } from "@/lib/cards";

interface CardData {
  word: string;
  translation: string | null;
  part_of_speech: string | null;
  example_en: string | null;
  example_id: string | null;
  grammar_note: string | null;
  word_forms?: WordForms;
}

export async function editCardAction(
  id: string,
  data: CardData
): Promise<Card> {
  const card = await updateCard(id, { ...data, source: "manual" });
  revalidatePath("/cards");
  revalidatePath("/");
  return card;
}

export async function regenCardAction(
  id: string,
  data: CardData
): Promise<Card> {
  const card = await updateCard(id, { ...data, source: "ai" });
  revalidatePath("/cards");
  revalidatePath("/");
  return card;
}

export async function deleteCardAction(id: string): Promise<void> {
  await deleteCard(id);
  revalidatePath("/cards");
  revalidatePath("/");
}

export async function archiveCardAction(id: string): Promise<Card> {
  const card = await updateCard(id, { is_active: false });
  revalidatePath("/cards");
  revalidatePath("/");
  return card;
}

export async function activateCardAction(id: string): Promise<Card> {
  const card = await updateCard(id, { is_active: true });
  revalidatePath("/cards");
  revalidatePath("/");
  return card;
}
