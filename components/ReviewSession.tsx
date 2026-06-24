"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { Block, Course, Focus, ReviewItem } from "@/lib/types";
import { appendReviewLog, getCourses, getDueItems, upsertReviewItem } from "@/lib/db";
import { isLeech, schedule } from "@/lib/srs";
import { findBlock, shuffle } from "@/lib/course-utils";
import { notifyDueChanged } from "@/lib/events";
import { pick, useLang } from "@/lib/i18n";
import InteractiveCard from "./InteractiveCard";
import ProgressBar from "./ProgressBar";
import type { CardOutcome } from "./card-shared";

type QueueEntry = { item: ReviewItem; block: Block; course: Course };

function blockFocus(block: Block): Focus | undefined {
  return "focus" in block ? block.focus : undefined;
}

async function buildReviewQueue(
  courseId?: string,
  focus?: Focus
): Promise<QueueEntry[]> {
  const courses = await getCourses();
  const due = await getDueItems(Date.now(), courseId);
  const entries: QueueEntry[] = [];

  for (const item of due) {
    const course = courses[item.courseId];
    if (!course) continue;
    const found = findBlock(course, item.id);
    if (!found) continue;
    if (focus && blockFocus(found.block) !== focus) continue;
    entries.push({ item, block: found.block, course });
  }

  return shuffle(entries);
}

export default function ReviewSession({
  courseId,
  focus,
}: {
  courseId?: string;
  focus?: Focus;
}) {
  const { t, lang, dir } = useLang();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [pos, setPos] = useState(0);
  const [stats, setStats] = useState({ reviewed: 0, autoGraded: 0, correct: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setPos(0);
    setStats({ reviewed: 0, autoGraded: 0, correct: 0 });
    setQueue(await buildReviewQueue(courseId, focus));
    setLoading(false);
  }, [courseId, focus]);

  useEffect(() => {
    let cancelled = false;

    buildReviewQueue(courseId, focus).then((entries) => {
      if (cancelled) return;
      setPos(0);
      setStats({ reviewed: 0, autoGraded: 0, correct: 0 });
      setQueue(entries);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, focus]);

  const current = queue[pos];
  const done = !loading && queue.length > 0 && pos >= queue.length;
  const empty = !loading && queue.length === 0;

  async function handleDone(outcome: CardOutcome) {
    if (!current) return;
    const grade = outcome.grade ?? "good";
    const updated = schedule(current.item, grade);
    await upsertReviewItem(updated);
    await appendReviewLog({
      at: new Date().toISOString(),
      courseId: current.item.courseId,
      type: current.item.type,
      focus: blockFocus(current.block),
      grade,
      correct: outcome.correct,
    });
    notifyDueChanged();

    setStats((s) => ({
      reviewed: s.reviewed + 1,
      autoGraded: s.autoGraded + (outcome.correct === undefined ? 0 : 1),
      correct: s.correct + (outcome.correct ? 1 : 0),
    }));

    // "Again" resurfaces the item later in the same session.
    if (grade === "again") {
      setQueue((q) => [...q, { ...current, item: updated }]);
    }
    setPos((p) => p + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("loadingReview")}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h2 className="mt-4 text-xl font-semibold text-zinc-100">
          {t("allCaughtUp")}
        </h2>
        <p className="mt-2 text-zinc-400">{t("allCaughtUpBody")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          {t("backToLibrary")}
        </Link>
      </div>
    );
  }

  if (done) {
    const accuracy =
      stats.autoGraded > 0
        ? Math.round((stats.correct / stats.autoGraded) * 100)
        : null;
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h2 className="mt-4 text-xl font-semibold text-zinc-100">
          {t("sessionComplete")}
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-2xl font-semibold text-zinc-100">
              {stats.reviewed}
            </div>
            <div className="text-xs text-zinc-500">{t("itemsReviewed")}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-2xl font-semibold text-zinc-100">
              {accuracy != null ? `${accuracy}%` : "—"}
            </div>
            <div className="text-xs text-zinc-500">{t("accuracyAuto")}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            {t("anotherRound")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
          >
            {t("done")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
          <span>
            {t("cardXofY", { n: pos + 1, total: queue.length })}
          </span>
          <span>{pick(lang, current.course.title, current.course.titleAr)}</span>
        </div>
        <ProgressBar value={(pos / queue.length) * 100} />
      </div>

      {isLeech(current.item) && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-none" />
          {t("leechHint")}
        </div>
      )}

      <div
        dir={dir}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <InteractiveCard
          key={`${pos}-${current.item.id}`}
          block={current.block}
          mode="review"
          onDone={handleDone}
        />
      </div>
    </div>
  );
}
