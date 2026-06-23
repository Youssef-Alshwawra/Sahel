import type { Block, Course, ProgressEntry, Section } from "./types";
import { isReviewable } from "./types";

/** Percentage of sections completed for a course (0–100). */
export function courseProgressPercent(
  course: Course,
  progress: ProgressEntry | undefined
): number {
  const total = course.sections.length;
  if (total === 0) return 0;
  const done = progress?.completedSections.length ?? 0;
  return Math.round((Math.min(done, total) / total) * 100);
}

export function isSectionComplete(
  sectionId: string,
  progress: ProgressEntry | undefined
): boolean {
  return progress?.completedSections.includes(sectionId) ?? false;
}

/** Number of reviewable blocks (mcq/fill/flashcard/written) in a section. */
export function reviewableCount(section: Section): number {
  return section.blocks.filter(isReviewable).length;
}

/** Locate a block (and its section) anywhere in a course by block id. */
export function findBlock(
  course: Course,
  blockId: string
): { block: Block; section: Section } | undefined {
  for (const section of course.sections) {
    for (const block of section.blocks) {
      if ("id" in block && block.id === blockId) {
        return { block, section };
      }
    }
  }
  return undefined;
}

/** Shuffle a copy of an array (Fisher–Yates). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
