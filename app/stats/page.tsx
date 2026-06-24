"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, Flame, Target } from "lucide-react";
import type {
  Block,
  Course,
  Focus,
  ReviewItem,
  ReviewLogEntry,
  Settings,
} from "@/lib/types";
import { getCourses, getReviewItems, getReviewLog, getSettings } from "@/lib/db";
import { findBlock } from "@/lib/course-utils";
import {
  activitySeries,
  computeStreak,
  dueForecast,
  focusBreakdown,
  leeches,
  recentAccuracy,
  todayCount,
} from "@/lib/insights";
import { pick, useLang } from "@/lib/i18n";
import ProgressBar from "@/components/ProgressBar";

const FOCUS_KEY: Record<Focus, "focusWhy" | "focusHow" | "focusWhen" | "focusWhat" | "focusSyntax"> = {
  why: "focusWhy",
  how: "focusHow",
  when: "focusWhen",
  what: "focusWhat",
  syntax: "focusSyntax",
};

function blockLabel(block: Block, lang: "en" | "ar"): string {
  switch (block.type) {
    case "mcq":
    case "written":
      return pick(lang, block.question, block.questionAr);
    case "fill":
      return pick(lang, block.prompt, block.promptAr);
    case "flashcard":
      return pick(lang, block.front, block.frontAr);
    default:
      return block.type;
  }
}

export default function StatsPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [log, setLog] = useState<ReviewLogEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  // Captured once at load so render stays pure (no Date.now() during render).
  const [now, setNow] = useState(0);

  useEffect(() => {
    (async () => {
      const [c, it, lg, st] = await Promise.all([
        getCourses(),
        getReviewItems(),
        getReviewLog(),
        getSettings(),
      ]);
      setCourses(c);
      setItems(Object.values(it));
      setLog(lg);
      setSettings(st);
      setNow(Date.now());
      setLoading(false);
    })();
  }, []);

  const streak = useMemo(() => computeStreak(log, new Date(now)), [log, now]);
  const today = useMemo(() => todayCount(log, new Date(now)), [log, now]);
  const accuracy = useMemo(() => recentAccuracy(log), [log]);
  const focusStats = useMemo(() => focusBreakdown(log), [log]);
  const forecast = useMemo(
    () => dueForecast(items, 7, new Date(now)),
    [items, now]
  );
  const activity = useMemo(
    () => activitySeries(log, 14, new Date(now)),
    [log, now]
  );
  const leechItems = useMemo(() => leeches(items), [items]);
  const dueNow = useMemo(
    () => items.filter((i) => new Date(i.dueAt).getTime() <= now).length,
    [items, now]
  );

  if (loading) {
    return <div className="py-24 text-center text-zinc-500">{t("loading")}</div>;
  }

  const goal = settings?.dailyGoal ?? 20;
  const goalPct = goal > 0 ? Math.min(100, (today / goal) * 100) : 0;
  const maxForecast = Math.max(1, ...forecast.map((d) => d.count));
  const maxActivity = Math.max(1, ...activity.map((d) => d.count));
  const hasData = log.length > 0 || items.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {t("statsTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{t("statsSubtitle")}</p>
      </div>

      {!hasData && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center text-zinc-400">
          {t("statsEmpty")}
        </div>
      )}

      {hasData && (
        <div className="space-y-8">
          {/* Top metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Flame className="h-4 w-4 text-amber-400" />
                {t("streak")}
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {streak}
              </div>
              <div className="text-xs text-zinc-500">{t("days")}</div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Target className="h-4 w-4 text-indigo-400" />
                {t("todayGoal")}
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {today}
                <span className="text-base font-normal text-zinc-500">
                  {" "}
                  / {goal}
                </span>
              </div>
              <ProgressBar value={goalPct} className="mt-2" />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="text-xs text-zinc-500">{t("dueNow")}</div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {dueNow}
              </div>
              {dueNow > 0 && (
                <Link
                  href="/review"
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {t("reviewNow")}
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="text-xs text-zinc-500">{t("recallRate")}</div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {accuracy != null ? `${accuracy}%` : "—"}
              </div>
              <div className="text-xs text-zinc-500">{t("last100")}</div>
            </div>
          </div>

          {/* Forecast */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-200">
              {t("forecast7")}
            </h2>
            <div className="flex items-end justify-between gap-2">
              {forecast.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs text-zinc-400">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-indigo-500/70"
                    style={{ height: `${8 + (d.count / maxForecast) * 80}px` }}
                  />
                  <span className="text-[10px] text-zinc-600">
                    {new Date(d.date).toLocaleDateString(lang, {
                      weekday: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Focus breakdown */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-1 text-sm font-semibold text-zinc-200">
              {t("byFocus")}
            </h2>
            <p className="mb-4 text-xs text-zinc-500">{t("byFocusHint")}</p>
            <div className="space-y-3">
              {focusStats.map((s) => (
                <div key={s.focus} className="flex items-center gap-3">
                  <span className="w-16 flex-none text-sm text-zinc-300">
                    {t(FOCUS_KEY[s.focus])}
                  </span>
                  <div className="flex-1">
                    <ProgressBar value={s.accuracy ?? 0} />
                  </div>
                  <span className="w-20 flex-none text-end text-xs text-zinc-500">
                    {s.accuracy != null ? `${s.accuracy}% · ${s.total}` : "—"}
                  </span>
                  {s.total > 0 && (
                    <Link
                      href={`/review?focus=${s.focus}`}
                      className="flex-none text-xs text-indigo-400 hover:underline"
                    >
                      {t("drill")}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <BarChart3 className="h-4 w-4 text-zinc-400" />
              {t("activity14")}
            </h2>
            <div className="flex items-end justify-between gap-1">
              {activity.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count}`}
                  className="flex-1 rounded-t bg-emerald-500/60"
                  style={{
                    height: `${4 + (d.count / maxActivity) * 64}px`,
                    opacity: d.count === 0 ? 0.25 : 1,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Leeches */}
          {leechItems.length > 0 && (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                {t("leeches")}
              </h2>
              <p className="mb-4 text-xs text-amber-200/70">{t("leechesHint")}</p>
              <ul className="space-y-2">
                {leechItems.slice(0, 12).map((item) => {
                  const course = courses[item.courseId];
                  const found = course && findBlock(course, item.id);
                  const label = found ? blockLabel(found.block, lang) : item.id;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/course/${item.courseId}/${item.sectionId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-colors hover:border-zinc-700"
                      >
                        <span className="min-w-0 flex-1 truncate text-zinc-200">
                          {label}
                        </span>
                        <span className="flex-none text-xs text-amber-300">
                          {t("lapsesN", { n: item.lapses ?? 0 })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
