"use client";

import type { Block } from "@/lib/types";
import { pick, useLang } from "@/lib/i18n";
import Markdown from "./Markdown";
import MermaidDiagram from "./MermaidDiagram";
import CodeBlock from "./CodeBlock";

/** Renders the non-interactive block types: note, diagram, code. */
export default function ContentBlock({ block }: { block: Block }) {
  const { lang } = useLang();

  switch (block.type) {
    case "note":
      return <Markdown>{pick(lang, block.md, block.mdAr)}</Markdown>;
    case "diagram":
      return (
        <MermaidDiagram
          code={pick(lang, block.code, block.codeAr)}
          caption={
            block.caption
              ? pick(lang, block.caption, block.captionAr)
              : undefined
          }
        />
      );
    case "code":
      return (
        <CodeBlock
          code={block.code}
          lang={block.lang}
          caption={
            block.caption
              ? pick(lang, block.caption, block.captionAr)
              : undefined
          }
        />
      );
    default:
      return null;
  }
}
