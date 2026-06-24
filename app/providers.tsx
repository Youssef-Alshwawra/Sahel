"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/types";
import { syncDataCourses } from "@/lib/db";
import { notifyDueChanged } from "@/lib/events";
import { LanguageProvider, useLang } from "@/lib/i18n";
import Pwa from "@/components/Pwa";

type DataCourseError = {
  file: string;
  message: string;
};

type DataCoursesResponse = {
  courses: Course[];
  errors: DataCourseError[];
};

function DataCourseBootstrap({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<DataCourseError[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const response = await fetch("/api/data-courses", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = (await response.json()) as DataCoursesResponse;
        await syncDataCourses(result.courses);

        if (!cancelled) {
          setErrors(result.errors);
          notifyDueChanged();
        }
      } catch (error) {
        if (!cancelled) {
          setErrors([
            {
              file: "data",
              message: error instanceof Error ? error.message : String(error),
            },
          ]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        {lang === "ar" ? "جارٍ تحميل الكورسات…" : "Loading courses…"}
      </div>
    );
  }

  return (
    <>
      {children}
      {errors.length > 0 && (
        <details className="fixed bottom-4 start-4 z-50 max-w-lg rounded-lg border border-amber-500/40 bg-zinc-950/95 p-3 text-sm text-amber-200 shadow-xl">
          <summary className="cursor-pointer font-medium">
            {lang === "ar"
              ? `تم تجاهل ${errors.length} من ملفات data`
              : `${errors.length} data file(s) were skipped`}
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-amber-100/80" dir="ltr">
            {errors.map((error, index) => (
              <li key={`${error.file}-${index}`}>
                <span className="font-semibold">{error.file}:</span>{" "}
                {error.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Pwa />
      <DataCourseBootstrap>{children}</DataCourseBootstrap>
    </LanguageProvider>
  );
}
