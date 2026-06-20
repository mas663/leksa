"use server";

import { updateCard } from "@/lib/cards";
import { advanceBox, resetBox, getNextReviewDate } from "@/lib/leitner";

export async function markCorrect(
  cardId: string,
  currentBox: number,
  timesCorrect: number
): Promise<{ newBox: number }> {
  const newBox = advanceBox(currentBox);
  await updateCard(cardId, {
    box: newBox,
    next_review: getNextReviewDate(newBox),
    times_correct: timesCorrect + 1,
    last_reviewed: new Date().toISOString(),
  });
  return { newBox };
}

export async function markIncorrect(
  cardId: string,
  timesWrong: number
): Promise<void> {
  await updateCard(cardId, {
    box: resetBox(),
    next_review: getNextReviewDate(1),
    times_wrong: timesWrong + 1,
    last_reviewed: new Date().toISOString(),
  });
}
