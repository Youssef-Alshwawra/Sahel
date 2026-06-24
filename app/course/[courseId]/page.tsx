"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import type { Course, ProgressEntry } from "@/lib/types";
import { deleteCourse, getCourse, getProgress } from "@/lib/db";
import {
  courseProgressPercent,
  isSectionComplete,
  reviewableCount,
} from "@/lib/course-utils";
import { notifyDueChanged } from "@/lib/events";
import { pick, pickArr, useLang } from "@/lib/i18n";
import ProgressBar from "@/components/ProgressBar";
import ImportSectionDialog from "@/components/ImportSectionDialog";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { t, lang } = useLang();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressEntry | undefined>();
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getCourse(courseId);
      setCourse(c ?? null);
      setProgress(await getProgress(courseId));
      setLoading(false);
    })();
  }, [courseId]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function exportJson() {
    if (!course) return;
    const blob = new Blob([JSON.stringify(course, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!course) return;
    const title = pick(lang, course.title, course.titleAr);
    if (!window.confirm(t("deleteConfirm", { title }))) return;
    await deleteCourse(course.id);
    notifyDueChanged();
    router.push("/");
  }

  if (loading) {
    return <div className="py-24 text-center text-zinc-500">{t("loading")}</div>;
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">
          {t("courseNotFound")}
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block text-indigo-400 hover:underline"
        >
          {t("backToLibrary")}
        </Link>
      </div>
    );
  }

  const pct = courseProgressPercent(course, progress);
  const continueId = progress?.lastSectionId ?? course.sections[0]?.id;
  const title = pick(lang, course.title, course.titleAr);
  const description = course.description
    ? pick(lang, course.description, course.descriptionAr)
    : undefined;
  const category = pick(lang, course.category, course.categoryAr);

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        ← {t("library")}
      </Link>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {category}
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-100">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-zinc-400">{description}</p>
          )}
        </div>
        <div className="flex flex-none flex-wrap gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            {t("importSection")}
          </button>
          <button
            onClick={exportJson}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="min-w-48 flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>{t("courseProgress")}</span>
            <span>{pct}%</span>
          </div>
          <ProgressBar value={pct} />
        </div>
        <div className="flex flex-wrap gap-2">
          {course.terms && course.terms.length > 0 && (
            <Link
              href={`/course/${course.id}/terms`}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <BookOpenText className="h-4 w-4 text-amber-400" />
              {t("terms")}
            </Link>
          )}
          <Link
            href={`/review?course=${course.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <BrainCircuit className="h-4 w-4 text-indigo-400" />
            {t("reviewThisCourse")}
          </Link>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("sectionsHeading")}
      </h2>
      <ol className="space-y-3">
        {course.sections.map((section, i) => {
          const complete = isSectionComplete(section.id, progress);
          const isContinue = section.id === continueId && !complete;
          const questions = reviewableCount(section);
          const sTitle = pick(lang, section.title, section.titleAr);
          const sOutline = pickArr(lang, section.outline, section.outlineAr);
          return (
            <li key={section.id}>
              <Link
                href={`/course/${course.id}/${section.id}`}
                className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                    complete
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {complete ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-zinc-100">
                    {sTitle}
                  </h3>
                  {sOutline.length > 0 && (
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {sOutline.join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">
                    {section.blocks.length} {t("blocks")} · {questions}{" "}
                    {t("questions")}
                  </p>
                </div>
                <span className="flex flex-none items-center gap-1.5 text-sm font-medium text-indigo-400">
                  {complete
                    ? t("revisit")
                    : isContinue
                    ? t("continue")
                    : t("start")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {showImport && (
        <ImportSectionDialog
          courseId={course.id}
          courseTitle={title}
          onClose={() => setShowImport(false)}
          onImported={({ added, replaced }) => {
            setShowImport(false);
            getCourse(courseId).then((c) => setCourse(c ?? null));
            notifyDueChanged();
            showToast(t("sectionsMerged", { added, replaced }));
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
