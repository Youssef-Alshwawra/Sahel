"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BrainCircuit, PartyPopper } from "lucide-react";
import type { Block, Course, Section } from "@/lib/types";
import { isReviewable } from "@/lib/types";
import {
  getCourse,
  getReviewItem,
  markSectionComplete,
  setLastSection,
  upsertReviewItem,
} from "@/lib/db";
import { newReviewItem, schedule } from "@/lib/srs";
import { notifyDueChanged } from "@/lib/events";
import { pick, useLang } from "@/lib/i18n";
import OutlineCard from "@/components/OutlineCard";
import ContentBlock from "@/components/ContentBlock";
import InteractiveCard from "@/components/InteractiveCard";
import ProgressBar from "@/components/ProgressBar";
import type { CardOutcome } from "@/components/card-shared";

type Phase = "outline" | "blocks" | "done";

export default function LearnPage() {
  const { courseId, sectionId } = useParams<{
    courseId: string;
    sectionId: string;
  }>();
  const { t, lang, dir } = useLang();

  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("outline");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const c = await getCourse(courseId);
      setCourse(c ?? null);
      setSection(c?.sections.find((s) => s.id === sectionId) ?? null);
      setLoading(false);
      if (c) await setLastSection(courseId, sectionId);
    })();
  }, [courseId, sectionId]);

  // Mark the section complete once the learner reaches the end.
  useEffect(() => {
    if (phase === "done" && course) {
      markSectionComplete(courseId, sectionId);
    }
  }, [phase, course, courseId, sectionId]);

  const block: Block | undefined = section?.blocks[index];
  const isContent = block ? !isReviewable(block) : false;

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (section && next >= section.blocks.length) {
        setPhase("done");
        return i;
      }
      return next;
    });
  }, [section]);

  // Enter / Space advances past non-interactive content blocks.
  useEffect(() => {
    if (phase !== "blocks" || !isContent) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, isContent, advance]);

  async function handleOutcome(outcome: CardOutcome) {
    if (!block || !("id" in block) || !isReviewable(block)) {
      advance();
      return;
    }
    const existing = await getReviewItem(block.id);
    const base =
      existing ??
      newReviewItem({
        id: block.id,
        courseId,
        sectionId,
        type: block.type,
      });

    if (outcome.grade) {
      // flashcard / written self-rating → schedule via SM-2.
      await upsertReviewItem(schedule(base, outcome.grade));
      notifyDueChanged();
    } else if (outcome.correct === false) {
      // wrong mcq / fill → resurface immediately (error exposure).
      await upsertReviewItem({ ...base, dueAt: new Date().toISOString() });
      notifyDueChanged();
    }
    advance();
  }

  if (loading) {
    return <div className="py-24 text-center text-zinc-500">{t("loading")}</div>;
  }

  if (!course || !section) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">
          {t("sectionNotFound")}
        </h1>
        <Link
          href={`/course/${courseId}`}
          className="mt-4 inline-block text-indigo-400 hover:underline"
        >
          {t("backToCourse")}
        </Link>
      </div>
    );
  }

  const sectionIdx = course.sections.findIndex((s) => s.id === sectionId);
  const nextSection = course.sections[sectionIdx + 1];
  const courseTitle = pick(lang, course.title, course.titleAr);
  const sectionTitle = pick(lang, section.title, section.titleAr);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3 text-sm">
        <Link
          href={`/course/${course.id}`}
          className="truncate text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← {courseTitle}
        </Link>
        {phase === "blocks" && (
          <span className="flex-none text-zinc-500">
            {index + 1} / {section.blocks.length}
          </span>
        )}
      </div>

      {phase === "blocks" && (
        <ProgressBar
          value={(index / section.blocks.length) * 100}
          className="mb-6"
        />
      )}

      {phase === "outline" && (
        <OutlineCard
          section={section}
          onBegin={() => {
            setIndex(0);
            setPhase("blocks");
          }}
        />
      )}

      {phase === "blocks" && block && (
        <div
          dir={dir}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          {isContent ? (
            <div>
              <ContentBlock block={block} />
              <button
                autoFocus
                onClick={advance}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-5 py-2.5 font-medium text-zinc-900 transition-colors hover:bg-white"
              >
                {t("next")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          ) : (
            <InteractiveCard
              key={`${index}-${"id" in block ? block.id : index}`}
              block={block}
              mode="learn"
              onDone={handleOutcome}
            />
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-indigo-400" />
          <h2 className="mt-4 text-xl font-semibold text-zinc-100">
            {t("sectionComplete")}
          </h2>
          <p className="mt-2 text-zinc-400">
            {t("sectionCompleteBody", { title: sectionTitle })}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {nextSection ? (
              <Link
                href={`/course/${course.id}/${nextSection.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
              >
                {t("nextSection")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            ) : (
              <Link
                href={`/course/${course.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
              >
                {t("backToCourse")}
              </Link>
            )}
            <Link
              href={`/review?course=${course.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <BrainCircuit className="h-4 w-4 text-indigo-400" />
              {t("reviewNow")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
