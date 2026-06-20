export const BOX_INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 15,
};

export function getNextReviewDate(box: number): string {
  const days = BOX_INTERVALS[Math.min(Math.max(box, 1), 5)] ?? 1;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function advanceBox(box: number): number {
  return Math.min(box + 1, 5);
}

export function resetBox(): number {
  return 1;
}
