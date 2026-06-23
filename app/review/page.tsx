"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n";
import ReviewSession from "@/components/ReviewSession";

function ReviewInner() {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") ?? undefined;
  return <ReviewSession courseId={course} />;
}

export default function ReviewPage() {
  const { t } = useLang();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {t("review")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{t("reviewSubtitle")}</p>
      </div>
      <Suspense
        fallback={
          <div className="py-24 text-center text-zinc-500">{t("loading")}</div>
        }
      >
        <ReviewInner />
      </Suspense>
    </div>
  );
}
