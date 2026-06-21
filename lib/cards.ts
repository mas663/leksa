import { createClient } from "@/lib/supabase/server";

export type WordForms =
  | { type: "verb"; v1: string; v2: string; v3: string }
  | { type: "noun"; singular: string; plural: string }
  | null;

export interface Card {
  id: string;
  user_id: string;
  word: string;
  translation: string | null;
  part_of_speech: string | null;
  example_en: string | null;
  example_id: string | null;
  grammar_note: string | null;
  word_forms: WordForms;
  source: "ai" | "manual";
  box: number;
  next_review: string;
  times_correct: number;
  times_wrong: number;
  created_at: string;
  last_reviewed: string | null;
  is_active: boolean;
}

export type NewCard = Pick<Card, "word"> &
  Partial<
    Pick<
      Card,
      | "translation"
      | "part_of_speech"
      | "example_en"
      | "example_id"
      | "grammar_note"
      | "word_forms"
      | "source"
    >
  >;

export type CardUpdate = Partial<
  Pick<
    Card,
    | "word"
    | "translation"
    | "part_of_speech"
    | "example_en"
    | "example_id"
    | "grammar_note"
    | "word_forms"
    | "source"
    | "box"
    | "next_review"
    | "times_correct"
    | "times_wrong"
    | "last_reviewed"
    | "is_active"
  >
>;

export async function getCards(): Promise<Card[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Kartu aktif saja — dipakai mode Latihan Bebas (/quiz/practice). */
export async function getActiveCards(): Promise<Card[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDueCards(): Promise<Card[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("is_active", true)
    .lte("next_review", new Date().toISOString())
    .order("next_review", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addCard(card: NewCard): Promise<Card> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Tidak terautentikasi");

  const { data, error } = await supabase
    .from("cards")
    .insert({
      ...card,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCard(id: string, update: CardUpdate): Promise<Card> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function getCardsForBoxPreview(): Promise<
  Pick<Card, "id" | "word" | "translation" | "box">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, word, translation, box")
    .order("word", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pick<Card, "id" | "word" | "translation" | "box">[];
}

export async function getCardCounts(): Promise<{
  total: number;
  due: number;
  archived: number;
  byBox: Record<number, number>;
}> {
  const supabase = await createClient();

  const [allRes, dueRes] = await Promise.all([
    supabase.from("cards").select("box, is_active"),
    supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("next_review", new Date().toISOString()),
  ]);

  if (allRes.error) throw allRes.error;
  if (dueRes.error) throw dueRes.error;

  const byBox: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let archived = 0;
  for (const row of allRes.data ?? []) {
    byBox[row.box] = (byBox[row.box] ?? 0) + 1;
    if (!row.is_active) archived++;
  }

  return {
    total: allRes.data?.length ?? 0,
    due: dueRes.count ?? 0,
    archived,
    byBox,
  };
}
