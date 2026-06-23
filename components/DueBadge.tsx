"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { getDueCount } from "@/lib/db";
import { DUE_CHANGED } from "@/lib/events";
import { useLang } from "@/lib/i18n";

export default function DueBadge() {
  const { t } = useLang();
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(() => {
    getDueCount()
      .then(setCount)
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(DUE_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DUE_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return (
    <Link
      href="/review"
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
    >
      <Brain className="h-4 w-4 text-indigo-400" />
      {t("review")}
      {count != null && count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
