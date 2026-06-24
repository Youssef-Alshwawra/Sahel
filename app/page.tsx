"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Sparkles } from "lucide-react";
import type { Course, ProgressEntry } from "@/lib/types";
import { getAllProgress, getCourses, saveCourse } from "@/lib/db";
import { sampleCourse } from "@/lib/sample";
import { notifyDueChanged } from "@/lib/events";
import { pick, useLang } from "@/lib/i18n";
import CourseCard from "@/components/CourseCard";
import ImportDialog from "@/components/ImportDialog";

export default function Home() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    const [c, p] = await Promise.all([getCourses(), getAllProgress()]);
    setCourses(c);
    setProgress(p);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCourses(), getAllProgress()]).then(([c, p]) => {
      if (cancelled) return;
      setCourses(c);
      setProgress(p);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  async function loadSample() {
    await saveCourse(sampleCourse);
    await refresh();
    showToast(t("sampleLoaded"));
  }

  const list = Object.values(courses).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
  const categories = [...new Set(list.map((c) => c.category))].sort();
  const isEmpty = !loading && list.length === 0;

  function categoryLabel(cat: string): string {
    const rep = list.find((c) => c.category === cat);
    return pick(lang, cat, rep?.categoryAr);
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            {t("library")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{t("librarySubtitle")}</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex flex-none items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          <Plus className="h-4 w-4" />
          {t("importCourse")}
        </button>
      </div>

      {loading && (
        <div className="py-24 text-center text-zinc-500">{t("loading")}</div>
      )}

      {isEmpty && (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-indigo-400" />
          <h2 className="mt-4 text-xl font-semibold text-zinc-100">
            {t("noCoursesTitle")}
          </h2>
          <p className="mt-2 text-zinc-400">{t("noCoursesBody")}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
            >
              <Plus className="h-4 w-4" />
              {t("importCourse")}
            </button>
            <button
              onClick={loadSample}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <Sparkles className="h-4 w-4" />
              {t("loadSample")}
            </button>
          </div>
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="space-y-10">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {categoryLabel(cat)}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list
                  .filter((c) => c.category === cat)
                  .map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={progress[course.id]}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImported={(course, overwritten) => {
            setShowImport(false);
            refresh();
            notifyDueChanged();
            const title = pick(lang, course.title, course.titleAr);
            showToast(
              overwritten
                ? t("updatedToast", { title })
                : t("importedToast", { title })
            );
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
