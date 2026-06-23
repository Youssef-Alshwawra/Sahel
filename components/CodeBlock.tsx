"use client";

import { useEffect, useState } from "react";

async function highlight(code: string, lang: string): Promise<string> {
  const { codeToHtml } = await import("shiki");
  try {
    return await codeToHtml(code, { lang, theme: "github-dark-default" });
  } catch {
    // Unknown / unsupported language → fall back to plain text highlighting.
    return await codeToHtml(code, { lang: "text", theme: "github-dark-default" });
  }
}

export default function CodeBlock({
  code,
  lang,
  caption,
}: {
  code: string;
  lang: string;
  caption?: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang)
      .then((out) => {
        if (!cancelled) setHtml(out);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  return (
    <figure className="overflow-hidden rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          {lang}
        </span>
      </div>
      {html ? (
        <div className="shiki-wrap" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto bg-[#0b0b0e] p-4 font-mono text-sm text-zinc-200">
          {code}
        </pre>
      )}
      {caption && (
        <figcaption className="border-t border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
