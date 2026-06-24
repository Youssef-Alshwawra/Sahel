"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpenText } from "lucide-react";
import type { Course } from "@/lib/types";
import { getCourse } from "@/lib/db";
import { pick, useLang } from "@/lib/i18n";
import Markdown from "@/components/Markdown";

export default function TermsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t, lang, dir } = useLang();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourse(courseId).then((result) => {
      setCourse(result ?? null);
      setLoading(false);
    });
  }, [courseId]);

  const terms = course?.terms
    ? [...course.terms].sort((a, b) =>
        pick(lang, a.term, a.termAr).localeCompare(
          pick(lang, b.term, b.termAr),
          lang
        )
      )
    : [];

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

  const courseTitle = pick(lang, course.title, course.titleAr);

  return (
    <div className="mx-auto max-w-3xl" dir={dir}>
      <Link
        href={`/course/${course.id}`}
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        ← {t("backToCourse")}
      </Link>

      <div className="mt-5 flex items-start gap-3">
        <span className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
          <BookOpenText className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            {t("termsTitle")}
          </h1>
          <p className="mt-1 text-zinc-400">
            {t("termsFor", { title: courseTitle })}
          </p>
        </div>
      </div>

      {terms.length === 0 ? (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
          {t("noTerms")}
        </div>
      ) : (
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {terms.map((item, index) => {
            const term = pick(lang, item.term, item.termAr);
            const definition = pick(
              lang,
              item.definition,
              item.definitionAr
            );

            return (
              <div
                key={`${item.term}-${index}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <dt className="font-mono text-base font-semibold text-amber-300">
                  {term}
                </dt>
                <dd className="mt-2 text-sm leading-7 text-zinc-300">
                  <Markdown>{definition}</Markdown>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
