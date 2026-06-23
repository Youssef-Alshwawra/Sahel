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

export type ReviewItem = {
  id: string; // = block id
  courseId: string;
  sectionId: string;
  type: ReviewableType;
  ease: number; // default 2.5
  interval: number; // days, default 0
  reps: number; // default 0
  lapses: number; // default 0
  dueAt: string; // ISO datetime
};

export type ProgressEntry = {
  completedSections: string[];
  lastSectionId?: string;
};
