import { get, set, del, createStore } from "idb-keyval";
import type { Course, Section } from "./schema";
import {
  DEFAULT_SETTINGS,
  type ProgressEntry,
  type ReviewItem,
  type ReviewLogEntry,
  type Settings,
} from "./types";

// A single named store keeps everything tidy and easy to export/import as one blob.
const store = createStore("sahel-db", "kv");

const COURSES_KEY = "courses";
const DATA_COURSE_IDS_KEY = "dataCourseIds";
const PROGRESS_KEY = "progress";
const REVIEW_KEY = "reviewItems";
const LOG_KEY = "reviewLog";
const SETTINGS_KEY = "settings";

/** Keep the review log from growing without bound (~years of daily reviews). */
const LOG_CAP = 10_000;

// ---- Courses -------------------------------------------------------------

export async function getCourses(): Promise<Record<string, Course>> {
  return (await get<Record<string, Course>>(COURSES_KEY, store)) ?? {};
}

export async function getCourse(id: string): Promise<Course | undefined> {
  const all = await getCourses();
  return all[id];
}

export async function saveCourse(course: Course): Promise<void> {
  const all = await getCourses();
  all[course.id] = course;
  await set(COURSES_KEY, all, store);
}

/**
 * Make courses discovered in the server-side data directory available to the
 * existing client-only learning flow. Data-directory courses are authoritative
 * for matching ids; imported courses with other ids are preserved.
 */
export async function syncDataCourses(courses: Course[]): Promise<void> {
  const [all, previousIds, progress, reviewItems] = await Promise.all([
    getCourses(),
    get<string[]>(DATA_COURSE_IDS_KEY, store),
    getAllProgress(),
    getReviewItems(),
  ]);

  const nextIds = new Set(courses.map((course) => course.id));
  const removedIds = new Set(
    (previousIds ?? []).filter((courseId) => !nextIds.has(courseId))
  );

  for (const courseId of removedIds) {
    delete all[courseId];
    delete progress[courseId];
  }

  for (const [reviewId, item] of Object.entries(reviewItems)) {
    if (removedIds.has(item.courseId)) delete reviewItems[reviewId];
  }

  for (const course of courses) all[course.id] = course;

  await Promise.all([
    set(COURSES_KEY, all, store),
    set(DATA_COURSE_IDS_KEY, [...nextIds], store),
    set(PROGRESS_KEY, progress, store),
    set(REVIEW_KEY, reviewItems, store),
  ]);
}

/**
 * Merge sections into an existing course: replace any whose `id` already
 * exists (in place), append the rest. Returns counts, or an error if the merge
 * would create duplicate block ids within the course (which breaks review
 * lookups, since blocks are addressed globally by id).
 */
export async function mergeSections(
  courseId: string,
  incoming: Section[]
): Promise<
  | { ok: true; added: number; replaced: number }
  | { ok: false; duplicateBlockIds: string[] }
> {
  const course = await getCourse(courseId);
  if (!course) throw new Error("Course not found");

  const byId = new Map(incoming.map((s) => [s.id, s]));
  const existingIds = new Set(course.sections.map((s) => s.id));
  let replaced = 0;

  // Replace matching sections in place; keep the rest as-is.
  const nextSections = course.sections.map((section) => {
    const incomingSection = byId.get(section.id);
    if (incomingSection) {
      replaced += 1;
      return incomingSection;
    }
    return section;
  });

  // Append sections that are genuinely new (deduped by id), in incoming order.
  const newSections = [...byId.values()].filter((s) => !existingIds.has(s.id));
  nextSections.push(...newSections);
  const added = newSections.length;

  // Detect duplicate block ids across the merged course.
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const section of nextSections) {
    for (const block of section.blocks) {
      if (!("id" in block)) continue;
      if (seen.has(block.id)) dupes.add(block.id);
      else seen.add(block.id);
    }
  }
  if (dupes.size > 0) {
    return { ok: false, duplicateBlockIds: [...dupes] };
  }

  await saveCourse({ ...course, sections: nextSections });
  return { ok: true, added, replaced };
}

export async function deleteCourse(id: string): Promise<void> {
  const courses = await getCourses();
  delete courses[id];
  await set(COURSES_KEY, courses, store);

  const progress = await getAllProgress();
  if (progress[id]) {
    delete progress[id];
    await set(PROGRESS_KEY, progress, store);
  }

  const items = await getReviewItems();
  let changed = false;
  for (const key of Object.keys(items)) {
    if (items[key].courseId === id) {
      delete items[key];
      changed = true;
    }
  }
  if (changed) await set(REVIEW_KEY, items, store);
}

// ---- Progress ------------------------------------------------------------

export async function getAllProgress(): Promise<Record<string, ProgressEntry>> {
  return (await get<Record<string, ProgressEntry>>(PROGRESS_KEY, store)) ?? {};
}

export async function getProgress(courseId: string): Promise<ProgressEntry> {
  const all = await getAllProgress();
  return all[courseId] ?? { completedSections: [] };
}

export async function markSectionComplete(
  courseId: string,
  sectionId: string
): Promise<void> {
  const all = await getAllProgress();
  const entry = all[courseId] ?? { completedSections: [] };
  if (!entry.completedSections.includes(sectionId)) {
    entry.completedSections = [...entry.completedSections, sectionId];
  }
  entry.lastSectionId = sectionId;
  all[courseId] = entry;
  await set(PROGRESS_KEY, all, store);
}

export async function setLastSection(
  courseId: string,
  sectionId: string
): Promise<void> {
  const all = await getAllProgress();
  const entry = all[courseId] ?? { completedSections: [] };
  entry.lastSectionId = sectionId;
  all[courseId] = entry;
  await set(PROGRESS_KEY, all, store);
}

// ---- Review items --------------------------------------------------------

export async function getReviewItems(): Promise<Record<string, ReviewItem>> {
  return (await get<Record<string, ReviewItem>>(REVIEW_KEY, store)) ?? {};
}

export async function upsertReviewItem(item: ReviewItem): Promise<void> {
  const all = await getReviewItems();
  all[item.id] = item;
  await set(REVIEW_KEY, all, store);
}

export async function getReviewItem(id: string): Promise<ReviewItem | undefined> {
  const all = await getReviewItems();
  return all[id];
}

export async function getDueItems(
  now: number = Date.now(),
  courseId?: string
): Promise<ReviewItem[]> {
  const all = await getReviewItems();
  return Object.values(all).filter((item) => {
    if (courseId && item.courseId !== courseId) return false;
    return new Date(item.dueAt).getTime() <= now;
  });
}

export async function getDueCount(now: number = Date.now()): Promise<number> {
  return (await getDueItems(now)).length;
}

// ---- Review log ----------------------------------------------------------

export async function getReviewLog(): Promise<ReviewLogEntry[]> {
  return (await get<ReviewLogEntry[]>(LOG_KEY, store)) ?? [];
}

export async function appendReviewLog(entry: ReviewLogEntry): Promise<void> {
  const log = await getReviewLog();
  log.push(entry);
  if (log.length > LOG_CAP) log.splice(0, log.length - LOG_CAP);
  await set(LOG_KEY, log, store);
}

// ---- Settings ------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const stored = await get<Partial<Settings>>(SETTINGS_KEY, store);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await set(SETTINGS_KEY, next, store);
  return next;
}

// ---- Backup / restore ----------------------------------------------------

export type Backup = {
  app: "sahel";
  version: 1;
  exportedAt: string;
  courses: Record<string, Course>;
  progress: Record<string, ProgressEntry>;
  reviewItems: Record<string, ReviewItem>;
  reviewLog: ReviewLogEntry[];
  settings: Settings;
};

/** Snapshot the entire local database into one serializable object. */
export async function exportAll(): Promise<Backup> {
  const [courses, progress, reviewItems, reviewLog, settings] =
    await Promise.all([
      getCourses(),
      getAllProgress(),
      getReviewItems(),
      getReviewLog(),
      getSettings(),
    ]);
  return {
    app: "sahel",
    version: 1,
    exportedAt: new Date().toISOString(),
    courses,
    progress,
    reviewItems,
    reviewLog,
    settings,
  };
}

function isBackup(data: unknown): data is Backup {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Backup).app === "sahel" &&
    (data as Backup).version === 1
  );
}

/**
 * Restore a backup. `replace` wipes existing data first; `merge` overlays the
 * backup on top (backup wins on key conflicts; logs are concatenated).
 */
export async function importAll(
  data: unknown,
  mode: "replace" | "merge" = "merge"
): Promise<void> {
  if (!isBackup(data)) {
    throw new Error("Not a valid Sahel backup file.");
  }

  if (mode === "replace") {
    await set(COURSES_KEY, data.courses ?? {}, store);
    await set(PROGRESS_KEY, data.progress ?? {}, store);
    await set(REVIEW_KEY, data.reviewItems ?? {}, store);
    await set(LOG_KEY, (data.reviewLog ?? []).slice(-LOG_CAP), store);
    await set(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...data.settings }, store);
    return;
  }

  await set(COURSES_KEY, { ...(await getCourses()), ...data.courses }, store);
  await set(
    PROGRESS_KEY,
    { ...(await getAllProgress()), ...data.progress },
    store
  );
  await set(
    REVIEW_KEY,
    { ...(await getReviewItems()), ...data.reviewItems },
    store
  );
  const mergedLog = [...(await getReviewLog()), ...(data.reviewLog ?? [])]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-LOG_CAP);
  await set(LOG_KEY, mergedLog, store);
  await saveSettings(data.settings ?? {});
}

/** Erase everything. Used by the "reset" action in settings. */
export async function clearAll(): Promise<void> {
  await Promise.all([
    del(COURSES_KEY, store),
    del(DATA_COURSE_IDS_KEY, store),
    del(PROGRESS_KEY, store),
    del(REVIEW_KEY, store),
    del(LOG_KEY, store),
    del(SETTINGS_KEY, store),
  ]);
}
