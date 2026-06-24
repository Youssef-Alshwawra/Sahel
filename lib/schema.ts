import { z } from "zod";

// Every text-bearing field has an optional Arabic counterpart (`*Ar`).
// Base fields are the primary language (usually English); the language toggle
// shows the `*Ar` value when present and falls back to the base otherwise.

const NoteBlock = z.object({
  type: z.literal("note"),
  md: z.string(),
  mdAr: z.string().optional(),
});

const DiagramBlock = z.object({
  type: z.literal("diagram"),
  engine: z.literal("mermaid").default("mermaid"),
  code: z.string(),
  codeAr: z.string().optional(),
  caption: z.string().optional(),
  captionAr: z.string().optional(),
});

const CodeBlock = z.object({
  type: z.literal("code"),
  lang: z.string(),
  code: z.string(),
  caption: z.string().optional(),
  captionAr: z.string().optional(),
});

const Focus = z.enum(["why", "how", "when", "what", "syntax"]);

const McqBlock = z.object({
  type: z.literal("mcq"),
  id: z.string(),
  question: z.string(),
  questionAr: z.string().optional(),
  options: z.array(z.string()).min(2),
  optionsAr: z.array(z.string()).optional(),
  answer: z.number().int().nonnegative(),
  explain: z.string().optional(),
  explainAr: z.string().optional(),
  focus: Focus.optional(),
});

const FillBlock = z.object({
  type: z.literal("fill"),
  id: z.string(),
  prompt: z.string(),
  promptAr: z.string().optional(),
  lang: z.string().optional(),
  template: z.string(), // contains "____"
  answer: z.union([z.string(), z.array(z.string())]),
  hints: z.array(z.string()).optional(),
  hintsAr: z.array(z.string()).optional(),
  focus: Focus.optional(),
});

const FlashcardBlock = z.object({
  type: z.literal("flashcard"),
  id: z.string(),
  front: z.string(),
  frontAr: z.string().optional(),
  back: z.string(),
  backAr: z.string().optional(),
  focus: Focus.optional(),
});

const WrittenBlock = z.object({
  type: z.literal("written"),
  id: z.string(),
  question: z.string(),
  questionAr: z.string().optional(),
  model: z.string(),
  modelAr: z.string().optional(),
  focus: Focus.optional(),
});

export const Term = z.object({
  term: z.string(),
  termAr: z.string().optional(),
  definition: z.string(),
  definitionAr: z.string().optional(),
});

export const Block = z.discriminatedUnion("type", [
  NoteBlock,
  DiagramBlock,
  CodeBlock,
  McqBlock,
  FillBlock,
  FlashcardBlock,
  WrittenBlock,
]);

export const Section = z.object({
  id: z.string(),
  title: z.string(),
  titleAr: z.string().optional(),
  outline: z.array(z.string()).default([]),
  outlineAr: z.array(z.string()).optional(),
  summary: z.string().optional(),
  summaryAr: z.string().optional(),
  blocks: z.array(Block),
});

export const Course = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  category: z.string(),
  categoryAr: z.string().optional(),
  title: z.string(),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  terms: z.array(Term).optional(),
  language: z.enum(["en", "ar", "mixed"]).default("en"),
  dir: z.enum(["ltr", "rtl"]).default("ltr"),
  sections: z.array(Section).min(1),
});

export type Course = z.infer<typeof Course>;
export type Block = z.infer<typeof Block>;
export type Section = z.infer<typeof Section>;
export type Focus = z.infer<typeof Focus>;
export type Term = z.infer<typeof Term>;

type Issue = { path: PropertyKey[]; message: string };

function issuesToStrings(issues: readonly Issue[], prefix = ""): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? issue.path.map(String).join(".") : "(root)";
    return `${prefix}${path}: ${issue.message}`;
  });
}

/** Parse unknown JSON into a Course, returning either the value or friendly errors. */
export function parseCourse(
  data: unknown
): { ok: true; course: Course } | { ok: false; errors: string[] } {
  const result = Course.safeParse(data);
  if (result.success) return { ok: true, course: result.data };
  return { ok: false, errors: issuesToStrings(result.error.issues) };
}

/**
 * Parse JSON describing one or more sections to merge into an existing course.
 * Accepts a single section object, a bare array of sections, or an object with
 * a `sections` array (so a full-course export can be reused as a source).
 */
export function parseSection(
  data: unknown
): { ok: true; sections: Section[] } | { ok: false; errors: string[] } {
  let candidates: unknown[];
  if (Array.isArray(data)) {
    candidates = data;
  } else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { sections?: unknown }).sections)
  ) {
    candidates = (data as { sections: unknown[] }).sections;
  } else {
    candidates = [data];
  }

  const sections: Section[] = [];
  const errors: string[] = [];
  candidates.forEach((candidate, i) => {
    const result = Section.safeParse(candidate);
    if (result.success) sections.push(result.data);
    else
      errors.push(
        ...issuesToStrings(
          result.error.issues,
          candidates.length > 1 ? `[${i}] ` : ""
        )
      );
  });

  if (errors.length) return { ok: false, errors };
  if (sections.length === 0) return { ok: false, errors: ["__noSection__"] };
  return { ok: true, sections };
}
