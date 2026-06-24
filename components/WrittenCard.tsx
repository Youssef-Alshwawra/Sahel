"use client";

import { useState } from "react";
import type { WrittenBlock } from "@/lib/types";
import { pick, useLang } from "@/lib/i18n";
import FocusBadge from "./FocusBadge";
import RatingButtons from "./RatingButtons";
import Markdown from "./Markdown";
import type { CardMode, CardOutcome } from "./card-shared";

export default function WrittenCard({
  block,
  onDone,
}: {
  block: WrittenBlock;
  mode: CardMode;
  onDone: (outcome: CardOutcome) => void;
}) {
  const { t, lang } = useLang();
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);

  const question = pick(lang, block.question, block.questionAr);
  const model = pick(lang, block.model, block.modelAr);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("writtenLabel")}
        </span>
        <FocusBadge focus={block.focus} />
      </div>
      <p className="text-lg font-medium text-zinc-100">{question}</p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder={t("writePlaceholder")}
        className="mt-4 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
      />

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          {t("showModel")}
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          {value.trim() && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {t("yourAnswer")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-zinc-300">{value}</p>
            </div>
          )}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-400/80">
              {t("modelAnswer")}
            </p>
            <Markdown className="mt-2 text-zinc-200">{model}</Markdown>
          </div>
          <RatingButtons
            onRate={(grade) => onDone({ grade })}
            prompt={t("matchPrompt")}
          />
        </div>
      )}
    </div>
  );
}
