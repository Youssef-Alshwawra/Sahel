"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import type { Course, ProgressEntry } from "@/lib/types";
import { courseProgressPercent } from "@/lib/course-utils";
import { pick, useLang } from "@/lib/i18n";
import ProgressBar from "./ProgressBar";

export default function CourseCard({
  course,
  progress,
}: {
  course: Course;
  progress?: ProgressEntry;
}) {
  const { t, lang } = useLang();
  const pct = courseProgressPercent(course, progress);
  const sectionCount = course.sections.length;
  const title = pick(lang, course.title, course.titleAr);
  const description = course.description
    ? pick(lang, course.description, course.descriptionAr)
    : undefined;

  return (
    <Link
      href={`/course/${course.id}`}
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <h3 className="font-semibold text-zinc-100 group-hover:text-white">
        {title}
      </h3>

      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{description}</p>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
        <Layers className="h-3.5 w-3.5" />
        {sectionCount} {sectionCount === 1 ? t("section") : t("sections")}
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
          <span>{t("progress")}</span>
          <span>{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>
    </Link>
  );
}
