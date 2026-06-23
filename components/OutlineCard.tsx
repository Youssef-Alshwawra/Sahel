"use client";

import { ListChecks } from "lucide-react";
import type { Section } from "@/lib/types";
import { pick, pickArr, useLang } from "@/lib/i18n";

export default function OutlineCard({
  section,
  onBegin,
}: {
  section: Section;
  onBegin?: () => void;
}) {
  const { t, lang } = useLang();
  const title = pick(lang, section.title, section.titleAr);
  const outline = pickArr(lang, section.outline, section.outlineAr);
  const summary = section.summary
    ? pick(lang, section.summary, section.summaryAr)
    : undefined;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center gap-2 text-indigo-400">
        <ListChecks className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t("outline")}
        </span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-100">{title}</h2>

      {outline.length > 0 && (
        <ul className="mt-4 space-y-2">
          {outline.map((item, i) => (
            <li key={i} className="flex gap-3 text-zinc-300">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-indigo-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {summary && (
        <p className="mt-5 border-t border-zinc-800 pt-4 leading-relaxed text-zinc-400">
          {summary}
        </p>
      )}

      {onBegin && (
        <button
          onClick={onBegin}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          {t("begin")}
        </button>
      )}
    </div>
  );
}
