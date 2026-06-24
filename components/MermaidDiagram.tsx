"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { translate, useLang } from "@/lib/i18n";

type PanStart = {
  pointerId: number;
  x: number;
  y: number;
  scrollLeft: number;
  scrollTop: number;
};

const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;

function previewWidth(svg: string): number {
  const viewBox = svg.match(
    /viewBox=["']\s*[-\d.]+[,\s]+[-\d.]+[,\s]+([\d.]+)[,\s]+([\d.]+)\s*["']/i
  );
  const naturalWidth = viewBox ? Number(viewBox[1]) : 900;
  return Math.min(2400, Math.max(900, naturalWidth));
}

export default function MermaidDiagram({
  code,
  caption,
  language,
}: {
  code: string;
  caption?: string;
  language?: Lang;
}) {
  const { lang } = useLang();
  const controlLanguage = language ?? lang;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const dialogRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<PanStart | null>(null);
  const rawId = useId();
  const id = "mmd-" + rawId.replace(/[^a-zA-Z0-9]/g, "");

  const labels = {
    preview: translate(controlLanguage, "preview"),
    close: translate(controlLanguage, "close"),
    diagram: translate(controlLanguage, "diagram"),
    diagramPreview: translate(controlLanguage, "diagramPreview"),
    dragToMove: translate(controlLanguage, "dragToMove"),
    zoomIn: translate(controlLanguage, "zoomIn"),
    zoomOut: translate(controlLanguage, "zoomOut"),
    resetZoom: translate(controlLanguage, "resetZoom"),
  };

  function zoomIn() {
    setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  }

  function zoomOut() {
    setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  }

  function resetZoom() {
    setZoom(100);
  }

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
        const rendered = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(rendered.svg);
          setZoom(100);
          setPreviewOpen(false);
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

  useEffect(() => {
    if (!previewOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
      canvas.scrollTop = Math.max(0, (canvas.scrollHeight - canvas.clientHeight) / 2);
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreviewOpen(false);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewOpen]);

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    const canvas = event.currentTarget;
    panStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: canvas.scrollLeft,
      scrollTop: canvas.scrollTop,
    };
    canvas.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    const start = panStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    event.preventDefault();
    const canvas = event.currentTarget;
    canvas.scrollLeft = start.scrollLeft - (event.clientX - start.x);
    canvas.scrollTop = start.scrollTop - (event.clientY - start.y);
  }

  function stopPan(event: React.PointerEvent<HTMLDivElement>) {
    const start = panStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panStartRef.current = null;
    setDragging(false);
  }

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
    <>
      <figure className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div
          className="mb-3 flex flex-wrap items-center justify-end gap-1.5"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={!svg}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            title={labels.preview}
            aria-label={labels.preview}
          >
            <Maximize2 className="h-4 w-4" />
            {labels.preview}
          </button>
          <button
            type="button"
            onClick={zoomOut}
            disabled={!svg || zoom <= MIN_ZOOM}
            className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            title={labels.zoomOut}
            aria-label={labels.zoomOut}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-mono text-xs text-zinc-400">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!svg || zoom >= MAX_ZOOM}
            className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            title={labels.zoomIn}
            aria-label={labels.zoomIn}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={!svg || zoom === 100}
            className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2 text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            title={labels.resetZoom}
            aria-label={labels.resetZoom}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {svg && !previewOpen ? (
          <div className="max-h-[32rem] overflow-auto rounded-md bg-zinc-950/40 p-3">
            <div
              className="mermaid-container mermaid-zoom-content mx-auto flex justify-center transition-[width] duration-150"
              style={{ width: `${zoom}%` }}
              aria-label={labels.diagram}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ) : (
          <div className="h-40 animate-pulse rounded-md bg-zinc-800/50" />
        )}

        {caption && (
          <figcaption className="mt-3 text-center text-sm text-zinc-400">
            {caption}
          </figcaption>
        )}
      </figure>

      {previewOpen && svg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewOpen(false);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={labels.diagramPreview}
            tabIndex={-1}
            className="flex h-[calc(100vh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl outline-none sm:h-[calc(100vh-2rem)]"
          >
            <header className="flex flex-col gap-3 border-b border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-semibold text-zinc-100">
                  {labels.diagramPreview}
                </h2>
                <p className="text-sm text-zinc-500">{labels.dragToMove}</p>
              </div>
              <div
                className="flex flex-wrap items-center justify-end gap-1.5"
                dir="ltr"
              >
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  title={labels.zoomOut}
                  aria-label={labels.zoomOut}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-mono text-xs text-zinc-400">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  title={labels.zoomIn}
                  aria-label={labels.zoomIn}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  disabled={zoom === 100}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  title={labels.resetZoom}
                  aria-label={labels.resetZoom}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  title={labels.close}
                  aria-label={labels.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div
              ref={canvasRef}
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={stopPan}
              onPointerCancel={stopPan}
              className={`min-h-0 flex-1 touch-none select-none overflow-auto bg-zinc-950/70 p-6 ${
                dragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              aria-label={labels.dragToMove}
            >
              <div
                className="mermaid-container mermaid-preview-content mx-auto"
                style={{ width: `${previewWidth(svg) * (zoom / 100)}px` }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
