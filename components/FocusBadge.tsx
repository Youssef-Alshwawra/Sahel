"use client";

import type { Focus } from "@/lib/types";
import { useLang } from "@/lib/i18n";

type FocusKey = "focusWhy" | "focusHow" | "focusWhen" | "focusWhat" | "focusSyntax";

const MAP: Record<Focus, { key: FocusKey; cls: string }> = {
  why: { key: "focusWhy", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  how: { key: "focusHow", cls: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  when: {
    key: "focusWhen",
    cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
  what: {
    key: "focusWhat",
    cls: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  },
  syntax: {
    key: "focusSyntax",
    cls: "bg-zinc-500/20 text-zinc-300 ring-zinc-500/30",
  },
};

export default function FocusBadge({ focus }: { focus?: Focus }) {
  const { t } = useLang();
  if (!focus) return null;
  const f = MAP[focus];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${f.cls}`}
    >
      {t(f.key)}
    </span>
  );
}
