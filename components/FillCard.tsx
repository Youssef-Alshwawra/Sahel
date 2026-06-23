"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import type { FillBlock } from "@/lib/types";
import { pick, pickArr, useLang } from "@/lib/i18n";
import FocusBadge from "./FocusBadge";
import RatingButtons from "./RatingButtons";
import type { CardMode, CardOutcome } from "./card-shared";
import { normalize } from "./card-shared";

export default function FillCard({
  block,
  mode,
  onDone,
}: {
  block: FillBlock;
  mode: CardMode;
  onDone: (outcome: CardOutcome) => void;
}) {
  const { t, lang } = useLang();
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = pick(lang, block.prompt, block.promptAr);
  const hints = block.hints ? pickArr(lang, block.hints, block.hintsAr) : [];
  const answers = Array.isArray(block.answer) ? block.answer : [block.answer];
  const isCorrect = answers.some((a) => normalize(a) === normalize(value));
  const parts = block.template.split("____");

  useEffect(() => {
    setValue("");
    setSubmitted(false);
    inputRef.current?.focus();
  }, [block.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submitted && mode === "learn" && e.key === "Enter") {
        e.preventDefault();
        onDone({ correct: isCorrect });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitted, mode, onDone, isCorrect]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submitted && value.trim()) setSubmitted(true);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("fillLabel")}
        </span>
        <FocusBadge focus={block.focus} />
      </div>
      <p className="text-lg font-medium text-zinc-100">{prompt}</p>

      <div
        dir="ltr"
        className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-[#0b0b0e] p-4 font-mono text-sm text-zinc-200"
      >
        <span className="whitespace-pre-wrap">{parts[0]}</span>
        <span className="mx-1 rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-300">
          {submitted ? value || "____" : "____"}
        </span>
        <span className="whitespace-pre-wrap">{parts.slice(1).join("____")}</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          ref={inputRef}
          value={value}
          disabled={submitted}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("typeBlank")}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 font-mono text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500 disabled:opacity-70"
        />
        {!submitted && (
          <button
            type="submit"
            disabled={!value.trim()}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("check")}
          </button>
        )}
      </form>

      {submitted && (
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
            {!isCorrect && (
              <p className="mt-1 text-zinc-300">
                {t("answerColon")}{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-emerald-300">
                  {answers[0]}
                </code>
              </p>
            )}
            {!isCorrect && hints.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {hints.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-amber-200"
                  >
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-none" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
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
