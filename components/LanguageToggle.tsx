"use client";

import { Languages } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { toggle, t } = useLang();
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
      title="Switch language"
    >
      <Languages className="h-4 w-4 text-indigo-400" />
      {t("langToggle")}
    </button>
  );
}
