"use client";

import { useEffect, useState } from "react";
import type { FlashcardBlock } from "@/lib/types";
import { pick, useLang } from "@/lib/i18n";
import FocusBadge from "./FocusBadge";
import RatingButtons from "./RatingButtons";
import Markdown from "./Markdown";
import type { CardMode, CardOutcome } from "./card-shared";

export default function FlashcardCard({
  block,
  onDone,
}: {
  block: FlashcardBlock;
  mode: CardMode;
  onDone: (outcome: CardOutcome) => void;
}) {
  const { t, lang } = useLang();
  const [revealed, setRevealed] = useState(false);

  const front = pick(lang, block.front, block.frontAr);
  const back = pick(lang, block.back, block.backAr);

  useEffect(() => {
    setRevealed(false);
  }, [block.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("flashcardLabel")}
        </span>
        <FocusBadge focus={block.focus} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {t("front")}
        </p>
        <div className="mt-1 text-lg text-zinc-100">
          <Markdown>{front}</Markdown>
        </div>

        {revealed && (
          <div className="mt-5 border-t border-zinc-800 pt-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {t("back")}
            </p>
            <div className="mt-1 text-zinc-200">
              <Markdown>{back}</Markdown>
            </div>
          </div>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          {t("showAnswer")}
        </button>
      ) : (
        <div className="mt-5">
          <RatingButtons onRate={(grade) => onDone({ grade })} />
        </div>
      )}
    </div>
  );
}
