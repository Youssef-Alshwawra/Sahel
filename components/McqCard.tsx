"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { McqBlock } from "@/lib/types";
import { pick, pickArr, useLang } from "@/lib/i18n";
import FocusBadge from "./FocusBadge";
import RatingButtons from "./RatingButtons";
import Markdown from "./Markdown";
import type { CardMode, CardOutcome } from "./card-shared";

export default function McqCard({
  block,
  mode,
  onDone,
}: {
  block: McqBlock;
  mode: CardMode;
  onDone: (outcome: CardOutcome) => void;
}) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === block.answer;

  const question = pick(lang, block.question, block.questionAr);
  const options = pickArr(lang, block.options, block.optionsAr);
  const explain = block.explain
    ? pick(lang, block.explain, block.explainAr)
    : undefined;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!submitted) {
        const n = parseInt(e.key, 10);
        if (!Number.isNaN(n) && n >= 1 && n <= options.length) {
          e.preventDefault();
          setSelected(n - 1);
          return;
        }
        if (e.key === "Enter" && selected != null) {
          e.preventDefault();
          setSubmitted(true);
        }
      } else if (mode === "learn" && e.key === "Enter") {
        e.preventDefault();
        onDone({ correct: isCorrect });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitted, selected, options.length, mode, onDone, isCorrect]);

  function optionClasses(i: number): string {
    if (!submitted) {
      return selected === i
        ? "border-indigo-500 bg-indigo-500/10"
        : "border-zinc-700 bg-zinc-900 hover:border-zinc-600";
    }
    if (i === block.answer) return "border-emerald-500 bg-emerald-500/10";
    if (i === selected) return "border-rose-500 bg-rose-500/10";
    return "border-zinc-800 bg-zinc-900 opacity-60";
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("mcqLabel")}
        </span>
        <FocusBadge focus={block.focus} />
      </div>
      <p className="text-lg font-medium text-zinc-100">{question}</p>

      <ul className="mt-4 space-y-2">
        {options.map((opt, i) => (
          <li key={i}>
            <button
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors ${optionClasses(
                i
              )}`}
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-black/30 font-mono text-xs text-zinc-400">
                {i + 1}
              </span>
              <span className="flex-1 text-zinc-200">{opt}</span>
              {submitted && i === block.answer && (
                <Check className="h-5 w-5 flex-none text-emerald-400" />
              )}
              {submitted && i === selected && i !== block.answer && (
                <X className="h-5 w-5 flex-none text-rose-400" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {!submitted ? (
        <button
          disabled={selected == null}
          onClick={() => setSubmitted(true)}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("submit")}
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <div
            className={`rounded-lg border p-4 ${
              isCorrect
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-rose-500/40 bg-rose-500/10"
            }`}
          >
            <p
              className={`font-medium ${
                isCorrect ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {isCorrect ? t("correct") : t("notQuite")}
            </p>
            {explain && (
              <Markdown className="mt-2 text-zinc-300">{explain}</Markdown>
            )}
          </div>

          {mode === "learn" ? (
            <button
              onClick={() => onDone({ correct: isCorrect })}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-5 py-2.5 font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              {t("continue")}
            </button>
          ) : (
            <RatingButtons
              onRate={(grade) => onDone({ correct: isCorrect, grade })}
            />
          )}
        </div>
      )}
    </div>
  );
}
