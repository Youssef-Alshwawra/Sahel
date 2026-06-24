import type { Focus, ReviewItem, ReviewLogEntry } from "./types";
import { isSuccess } from "./types";
import { isLeech } from "./srs";

const DAY_MS = 86_400_000;
export const FOCUSES: Focus[] = ["why", "how", "when", "what", "syntax"];

/** Local YYYY-MM-DD key for grouping by calendar day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Number of log entries recorded today (local time). */
export function todayCount(log: ReviewLogEntry[], now = new Date()): number {
  const today = dayKey(now);
  return log.filter((e) => dayKey(new Date(e.at)) === today).length;
}

/**
 * Current streak: consecutive days (ending today or yesterday) with at least
 * one review. Yesterday counts so the streak survives until end-of-day.
 */
export function computeStreak(log: ReviewLogEntry[], now = new Date()): number {
  if (log.length === 0) return 0;
  const days = new Set(log.map((e) => dayKey(new Date(e.at))));
  let streak = 0;
  const cursor = new Date(now);

  if (!days.has(dayKey(cursor))) {
    cursor.setTime(cursor.getTime() - DAY_MS); // allow ending yesterday
    if (!days.has(dayKey(cursor))) return 0;
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/** Success rate (%) over the most recent `n` auto-trackable entries. */
export function recentAccuracy(
  log: ReviewLogEntry[],
  n = 100
): number | null {
  const recent = log.slice(-n);
  if (recent.length === 0) return null;
  const hits = recent.filter(isSuccess).length;
  return Math.round((hits / recent.length) * 100);
}

export type FocusStat = {
  focus: Focus;
  total: number;
  success: number;
  accuracy: number | null; // %
};

/** Per-focus success rate, surfacing which angle (why/how/…) is weakest. */
export function focusBreakdown(log: ReviewLogEntry[]): FocusStat[] {
  return FOCUSES.map((focus) => {
    const entries = log.filter((e) => e.focus === focus);
    const success = entries.filter(isSuccess).length;
    return {
      focus,
      total: entries.length,
      success,
      accuracy: entries.length ? Math.round((success / entries.length) * 100) : null,
    };
  });
}

/** The weakest focus area with enough data to be meaningful. */
export function weakestFocus(stats: FocusStat[], minTotal = 3): FocusStat | null {
  const eligible = stats.filter(
    (s) => s.total >= minTotal && s.accuracy != null
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((worst, s) =>
    (s.accuracy as number) < (worst.accuracy as number) ? s : worst
  );
}

export type ForecastDay = { date: string; count: number };

/** How many items come due on each of the next `days` days (incl. overdue today). */
export function dueForecast(
  items: ReviewItem[],
  days = 7,
  now = new Date()
): ForecastDay[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const buckets: ForecastDay[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    return { date: dayKey(d), count: 0 };
  });
  const lastMs = start.getTime() + (days - 1) * DAY_MS + DAY_MS - 1;

  for (const item of items) {
    const due = new Date(item.dueAt).getTime();
    if (due > lastMs) continue;
    const idx = Math.max(0, Math.floor((due - start.getTime()) / DAY_MS));
    if (idx >= 0 && idx < days) buckets[idx].count += 1;
  }
  return buckets;
}

/** Items repeatedly forgotten — candidates for reformulation. */
export function leeches(items: ReviewItem[]): ReviewItem[] {
  return items
    .filter(isLeech)
    .sort((a, b) => (b.lapses ?? 0) - (a.lapses ?? 0));
}

/** Reviews per day for the last `days` days (for a simple activity bar chart). */
export function activitySeries(
  log: ReviewLogEntry[],
  days = 14,
  now = new Date()
): { date: string; count: number }[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setTime(start.getTime() - (days - 1) * DAY_MS);
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(dayKey(new Date(start.getTime() + i * DAY_MS)), 0);
  }
  for (const e of log) {
    const key = dayKey(new Date(e.at));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}
