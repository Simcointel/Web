export function ScoreBar({ value, label, color }: { value: number; label: string; color?: string }) {
  const bg = color ?? (value >= 70 ? "bg-econ-green" : value >= 40 ? "bg-econ-amber" : "bg-econ-red");
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono font-bold w-8 text-right tabular-nums">{value}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bg}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-28 text-right">{label}</span>
    </div>
  );
}
