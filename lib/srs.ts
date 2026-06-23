import type { Grade, ReviewableType, ReviewItem } from "./types";

const DAY_MS = 86_400_000;

/** Create a fresh review item with SM-2 defaults, due now. */
export function newReviewItem(params: {
  id: string;
  courseId: string;
  sectionId: string;
  type: ReviewableType;
  dueAt?: string;
}): ReviewItem {
  return {
    id: params.id,
    courseId: params.courseId,
    sectionId: params.sectionId,
    type: params.type,
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    dueAt: params.dueAt ?? new Date().toISOString(),
  };
}

/**
 * SM-2 variant. Grades: again | hard | good | easy.
 * Kept dependency-free and swappable (e.g. for ts-fsrs) later.
 */
export function schedule(item: ReviewItem, grade: Grade): ReviewItem {
  let { ease = 2.5, interval = 0, reps = 0, lapses = 0 } = item;
  let dueAt: string;

  if (grade === "again") {
    reps = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
    interval = 0;
    dueAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // ~10 min, same session
  } else {
    const q = grade === "hard" ? 3 : grade === "good" ? 4 : 5;
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
    if (grade === "hard") interval = Math.max(1, Math.round(interval * 0.8));
    dueAt = new Date(Date.now() + interval * DAY_MS).toISOString();
  }

  return { ...item, ease, interval, reps, lapses, dueAt };
}
