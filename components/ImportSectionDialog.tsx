"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { parseSection } from "@/lib/schema";
import { mergeSections } from "@/lib/db";
import { useLang } from "@/lib/i18n";

export default function ImportSectionDialog({
  courseId,
  courseTitle,
  onClose,
  onImported,
}: {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onImported: (result: { added: number; replaced: number }) => void;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function importJson(raw: string) {
    setErrors([]);
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      setErrors([t("invalidJson", { msg: (e as Error).message })]);
      return;
    }

    const result = parseSection(data);
    if (!result.ok) {
      setErrors(
        result.errors.map((e) => (e === "__noSection__" ? t("noSectionFound") : e))
      );
      return;
    }

    setBusy(true);
    try {
      const merged = await mergeSections(courseId, result.sections);
      if (!merged.ok) {
        setErrors([
          t("dupBlockIds", { ids: merged.duplicateBlockIds.join(", ") }),
        ]);
        return;
      }
      onImported({ added: merged.added, replaced: merged.replaced });
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importJson(String(reader.result));
    reader.onerror = () => setErrors([t("fileReadError")]);
    reader.readAsText(file);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-10 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {t("importSection")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-zinc-400">
            {t("importSectionDesc", { title: courseTitle })}
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            dir="ltr"
            placeholder='{ "id": "…", "title": "…", "blocks": [ … ] }'
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-start font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
          />

          {errors.length > 0 && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
              <p className="font-medium text-rose-300">
                {t("importProblems", {
                  count: errors.length,
                  noun:
                    errors.length === 1 ? t("problemOne") : t("problemMany"),
                })}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-rose-200/90" dir="ltr">
                {errors.map((err, i) => (
                  <li key={i} className="font-mono">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={busy || !text.trim()}
              onClick={() => importJson(text)}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? t("importing") : t("importBtn")}
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800">
              <Upload className="h-4 w-4" />
              {t("uploadJson")}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFile}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
