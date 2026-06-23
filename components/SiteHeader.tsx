"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n";
import DueBadge from "./DueBadge";
import LanguageToggle from "./LanguageToggle";

export default function SiteHeader() {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100"
        >
          <GraduationCap className="h-5 w-5 text-indigo-400" />
          {t("appName")}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <DueBadge />
        </div>
      </div>
    </header>
  );
}
