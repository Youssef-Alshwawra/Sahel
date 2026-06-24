import type { Course, Block, Section, Focus } from "./schema";

export type { Course, Block, Section, Focus };

/** Narrow a Block down to a single variant, e.g. BlockOf<"mcq">. */
export type BlockOf<T extends Block["type"]> = Extract<Block, { type: T }>;

export type NoteBlock = BlockOf<"note">;
export type DiagramBlock = BlockOf<"diagram">;
export type CodeBlock = BlockOf<"code">;
export type McqBlock = BlockOf<"mcq">;
export type FillBlock = BlockOf<"fill">;
export type FlashcardBlock = BlockOf<"flashcard">;
export type WrittenBlock = BlockOf<"written">;

/** Block types that feed spaced repetition. */
export type ReviewableType = "mcq" | "fill" | "flashcard" | "written";

export const REVIEWABLE_TYPES: ReviewableType[] = [
  "mcq",
  "fill",
  "flashcard",
  "written",
];

export function isReviewable(block: Block): block is BlockOf<ReviewableType> {
  return (REVIEWABLE_TYPES as string[]).includes(block.type);
}

export type Grade = "again" | "hard" | "good" | "easy";

/** A reviewable item carrying its FSRS-6 scheduling state. Fields mirror a
 *  `ts-fsrs` Card (dates stored as ISO strings). Items saved before the FSRS
 *  migration may omit the scheduling fields; the scheduler treats those as new. */
export type ReviewItem = {
  id: string; // = block id
  courseId: string;
  sectionId: string;
  type: ReviewableType;
  dueAt: string; // ISO datetime — canonical "due" used across the app
  // FSRS state
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  learning_steps?: number;
  state?: number; // 0 new · 1 learning · 2 review · 3 relearning
  last_review?: string;
};

export type ProgressEntry = {
  completedSections: string[];
  lastSectionId?: string;
};

/** Append-only log of every graded answer, powering stats and streaks. */
export type ReviewLogEntry = {
  at: string; // ISO datetime
  courseId: string;
  type: ReviewableType;
  focus?: Focus;
  /** Self-rating, when the card asked for one (flashcard/written, or review mode). */
  grade?: Grade;
  /** Set for auto-graded types (mcq/fill); undefined for self-rated cards. */
  correct?: boolean;
};

/** A single review counts as a "success" for accuracy/retention purposes. */
export function isSuccess(entry: ReviewLogEntry): boolean {
  if (entry.correct !== undefined) return entry.correct;
  return entry.grade === "good" || entry.grade === "easy";
}

export type Settings = {
  dailyGoal: number;
  remindersEnabled: boolean;
  lastRemindedAt?: string; // ISO datetime
};

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 20,
  remindersEnabled: false,
};
