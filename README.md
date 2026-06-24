# Sahel

A personal, single-user learning app. It turns AI-generated **JSON courses** into an
interactive experience: read explanations, view Mermaid diagrams, drill with quizzes,
memorize syntax, browse an optional course glossary, and review weak items via spaced repetition.

- **No external database or auth backend.** Learning state lives in the browser
  (IndexedDB); a small local route scans built-in courses from `data/`.
- **Content is JSON**, validated with `zod` on import.
- **FSRS-6 spaced repetition** (via `ts-fsrs`) — fewer reviews for the same recall.
- **Stats dashboard**: streak, daily goal, due forecast, recall rate, per-focus
  strengths, and "sticking points" (leeches) you keep forgetting.
- **Installable PWA**, offline-capable, with optional local review reminders.
- **Backup & restore** the whole database as one JSON file.
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

1. **Auto-load** course JSON files placed in `data/`; refresh the app and valid
   files are synchronized into the local library automatically.
2. **Import** a course JSON on the home page (paste or upload `.json`), or click
   **Load sample course**. Invalid JSON shows field-level errors and is never saved.
3. **Learn** a section: it opens with the section's outline + summary, then steps
   through its blocks (notes, diagrams, code, and interactive questions).
4. Wrong `mcq`/`fill` answers are added to the **review deck** immediately; flashcards
   and written questions are self-rated into the deck.
5. **Review** surfaces everything that's due across all courses and reschedules it with
   a small SM-2 spaced-repetition algorithm.

## Project layout

| Path | What |
| --- | --- |
| `lib/schema.ts` | Authoritative `zod` schema + `parseCourse()`; TS types are inferred from it. |
| `lib/types.ts` | Shared types (`ReviewItem`, `ProgressEntry`, block helpers). |
| `lib/db.ts` | IndexedDB wrappers (`idb-keyval`): courses, progress, review items. |
| `data/` | Server-discovered JSON courses loaded without manual import. |
| `lib/srs.ts` | FSRS-6 scheduler (`ts-fsrs`) behind a small `schedule()`/`newReviewItem()` wrapper; migrates pre-FSRS items. |
| `lib/insights.ts` | Pure stat helpers: streak, recall rate, focus breakdown, due forecast, leeches. |
| `lib/notify.ts` | Free, server-less local review reminders (Notifications API). |
| `lib/sample.ts` | Sample course for the "Load sample" button. |
| `components/` | Cards, renderers (`Markdown`, `MermaidDiagram`, `CodeBlock`), dialogs. |
| `app/` | Routes: `/`, `/course/[courseId]`, `/course/[courseId]/[sectionId]`, `/review`, `/stats`, `/settings`. Plus `manifest.ts` (PWA) and `public/sw.js` (offline + notifications). |

The course JSON shape and the content-generation prompt live in `project-prompt.md`
(git-ignored, personal).

## Generating a course

Use the content-generation prompt in `project-prompt.md` (Appendix B) with any AI to
produce a single JSON object, then import it.

## Deployment

Learning state is client-side. Two deployment options exist on a VPS:

- **`next build && next start` behind Nginx** — works as-is (recommended, since the
  course/section routes are path-based dynamic segments and `data/` is scanned at
  runtime). Refresh the browser after changing files in `data/`.
- **Static export** — set `output: "export"` in `next.config.ts`. Note that the
  path-based dynamic routes would need to move to query params (e.g. `/course?id=…`)
  first, and runtime `data/` discovery would need to become a build-time manifest.
