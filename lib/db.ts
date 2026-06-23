import { get, set, createStore } from "idb-keyval";
import type { Course } from "./schema";
import type { ProgressEntry, ReviewItem } from "./types";

// A single named store keeps everything tidy and easy to export/import as one blob.
const store = createStore("sahel-db", "kv");

const COURSES_KEY = "courses";
const PROGRESS_KEY = "progress";
const REVIEW_KEY = "reviewItems";

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
