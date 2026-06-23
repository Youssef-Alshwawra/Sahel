"use client";

import type { Block } from "@/lib/types";
import McqCard from "./McqCard";
import FillCard from "./FillCard";
import FlashcardCard from "./FlashcardCard";
import WrittenCard from "./WrittenCard";
import type { CardMode, CardOutcome } from "./card-shared";

/** Dispatches the four reviewable block types to their interactive card. */
export default function InteractiveCard({
  block,
  mode,
  onDone,
}: {
  block: Block;
  mode: CardMode;
  onDone: (outcome: CardOutcome) => void;
}) {
  switch (block.type) {
    case "mcq":
      return <McqCard block={block} mode={mode} onDone={onDone} />;
    case "fill":
      return <FillCard block={block} mode={mode} onDone={onDone} />;
    case "flashcard":
      return <FlashcardCard block={block} mode={mode} onDone={onDone} />;
    case "written":
      return <WrittenCard block={block} mode={mode} onDone={onDone} />;
    default:
      return null;
  }
}
