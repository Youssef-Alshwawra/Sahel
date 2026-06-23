export default function ProgressBar({
  value,
  className = "",
}: {
  /** 0–100 */
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
