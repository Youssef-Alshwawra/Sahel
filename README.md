# Sahel

A personal, single-user learning app. It turns AI-generated **JSON courses** into an
interactive experience: read explanations, view Mermaid diagrams, drill with quizzes,
memorize syntax, and review weak items via spaced repetition.

- **No backend.** All data lives in the browser (IndexedDB).
- **Content is JSON**, validated with `zod` on import.
- **Dark mode**, mobile responsive, **RTL + LTR**.
- **Bilingual (EN/AR).** A single language toggle in the header flips the whole UI
  **and** the course content between English and Arabic (default English, remembered).
  Content fields have optional Arabic twins (`*Ar`) with automatic fallback.

## Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## How it works

1. **Import** a course JSON on the home page (paste or upload `.json`), or click
   **Load sample course**. Invalid JSON shows field-level errors and is never saved.
2. **Learn** a section: it opens with the section's outline + summary, then steps
   through its blocks (notes, diagrams, code, and interactive questions).
3. Wrong `mcq`/`fill` answers are added to the **review deck** immediately; flashcards
   and written questions are self-rated into the deck.
4. **Review** surfaces everything that's due across all courses and reschedules it with
   a small SM-2 spaced-repetition algorithm.

## Project layout

| Path | What |
| --- | --- |
| `lib/schema.ts` | Authoritative `zod` schema + `parseCourse()`; TS types are inferred from it. |
| `lib/types.ts` | Shared types (`ReviewItem`, `ProgressEntry`, block helpers). |
| `lib/db.ts` | IndexedDB wrappers (`idb-keyval`): courses, progress, review items. |
| `lib/srs.ts` | Dependency-free SM-2 scheduler. Swap in `ts-fsrs` later if wanted. |
| `lib/sample.ts` | Sample course for the "Load sample" button. |
| `components/` | Cards, renderers (`Markdown`, `MermaidDiagram`, `CodeBlock`), dialogs. |
| `app/` | The four routes: `/`, `/course/[courseId]`, `/course/[courseId]/[sectionId]`, `/review`. |

The course JSON shape and the content-generation prompt live in `project-prompt.md`
(git-ignored, personal).

## Generating a course

Use the content-generation prompt in `project-prompt.md` (Appendix B) with any AI to
produce a single JSON object, then import it.

## Deployment

The app is fully client-side. Two options on a VPS:

- **`next build && next start` behind Nginx** — works as-is (recommended, since the
  course/section routes are path-based dynamic segments).
- **Static export** — set `output: "export"` in `next.config.ts`. Note that the
  path-based dynamic routes would need to move to query params (e.g. `/course?id=…`)
  first, since course IDs only exist client-side.
