import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade as FsrsGrade,
} from "ts-fsrs";
import type { Grade, ReviewableType, ReviewItem } from "./types";

// FSRS-6 scheduler with library defaults. Dependency is `ts-fsrs` (MIT, runs
// fully in the browser — no backend, no network). It reaches a target
// retention with fewer reviews than the old SM-2 variant.
const scheduler = fsrs();

const RATING: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Number of lapses after which an item is treated as a "leech". */
export const LEECH_THRESHOLD = 4;

/** Build a ts-fsrs Card from a stored item. Legacy items (pre-FSRS) and brand
 *  new items both fall back to a fresh card seeded at their due date. */
function toCard(item: ReviewItem): Card {
  if (item.stability == null || item.state == null) {
    return createEmptyCard(new Date(item.dueAt ?? Date.now()));
  }
  return {
    due: new Date(item.dueAt),
    stability: item.stability,
    difficulty: item.difficulty ?? 0,
    elapsed_days: item.elapsed_days ?? 0,
    scheduled_days: item.scheduled_days ?? 0,
    reps: item.reps ?? 0,
    lapses: item.lapses ?? 0,
    learning_steps: item.learning_steps ?? 0,
    state: item.state,
    last_review: item.last_review ? new Date(item.last_review) : undefined,
  };
}

/** Merge a freshly-scheduled card back into the stored item. */
function fromCard(item: ReviewItem, card: Card): ReviewItem {
  return {
    ...item,
    dueAt: new Date(card.due).toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    state: card.state,
    last_review: card.last_review
      ? new Date(card.last_review).toISOString()
      : undefined,
  };
}

/** Create a fresh review item with FSRS defaults, due now. */
export function newReviewItem(params: {
  id: string;
  courseId: string;
  sectionId: string;
  type: ReviewableType;
  dueAt?: string;
}): ReviewItem {
  const card = createEmptyCard(
    params.dueAt ? new Date(params.dueAt) : new Date()
  );
  return fromCard(
    {
      id: params.id,
      courseId: params.courseId,
      sectionId: params.sectionId,
      type: params.type,
      dueAt: params.dueAt ?? new Date().toISOString(),
    } as ReviewItem,
    card
  );
}

/**
 * Reschedule an item from a grade. Grades: again | hard | good | easy.
 * Kept behind this small wrapper so the rest of the app stays scheduler-agnostic.
 */
export function schedule(item: ReviewItem, grade: Grade): ReviewItem {
  const { card } = scheduler.next(toCard(item), new Date(), RATING[grade]);
  return fromCard(item, card);
}

/** A leech is an item that keeps being forgotten — worth reformulating. */
export function isLeech(item: ReviewItem): boolean {
  return (item.lapses ?? 0) >= LEECH_THRESHOLD;
}
