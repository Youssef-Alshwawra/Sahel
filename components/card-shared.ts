import type { Grade } from "@/lib/types";

export type CardMode = "learn" | "review";

/** What a card reports when the user is done with it.
 *  - `correct` is set for auto-graded types (mcq/fill).
 *  - `grade` is set whenever the user picks a spaced-repetition rating
 *    (always in review mode; in learn mode for flashcard/written). */
export type CardOutcome = { correct?: boolean; grade?: Grade };

export const normalize = (s: string) => s.trim().toLowerCase();
