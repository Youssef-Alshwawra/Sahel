"use client";

import { useEffect } from "react";
import type { Grade } from "@/lib/types";
import { useLang } from "@/lib/i18n";

type GradeKey = "again" | "hard" | "good" | "easy";

const GRADES: { grade: Grade; key: GradeKey; hint: string; cls: string }[] = [
  {
    grade: "again",
    key: "again",
    hint: "1",
    cls: "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
  },
  {
    grade: "hard",
    key: "hard",
    hint: "2",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
  },
  {
    grade: "good",
    key: "good",
    hint: "3",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
  },
  {
    grade: "easy",
    key: "easy",
    hint: "4",
    cls: "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20",
  },
];

export default function RatingButtons({
  onRate,
  prompt,
}: {
  onRate: (grade: Grade) => void;
  /** Already-localized prompt; defaults to the recall prompt. */
  prompt?: string;
}) {
  const { t } = useLang();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        onRate(GRADES[idx].grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRate]);

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-400">{prompt ?? t("recallPrompt")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GRADES.map((g) => (
          <button
            key={g.grade}
            onClick={() => onRate(g.grade)}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${g.cls}`}
          >
            {t(g.key)}
            <kbd className="rounded bg-black/30 px-1 text-[10px] text-current opacity-70">
              {g.hint}
            </kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
