"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function MermaidDiagram({
  code,
  caption,
}: {
  code: string;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const rawId = useId();
  const id = "mmd-" + rawId.replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <p className="font-medium">Couldn&apos;t render this diagram.</p>
        <p className="mt-1 text-amber-200/80">{error}</p>
        <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-3 text-xs text-amber-100/90">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <figure className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div
        ref={ref}
        className="mermaid-container flex justify-center"
        aria-label="diagram"
      />
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-zinc-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
