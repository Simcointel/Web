export function MiniScoreBar({ value, maxWidth = 60 }: { value: number; maxWidth?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? "bg-econ-green" : pct >= 40 ? "bg-econ-amber" : "bg-econ-red";
  return (
    <div className="flex items-center gap-1.5" style={{ maxWidth }}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function MiniRegimeBadge({ regime }: { regime: string }) {
  const colors: Record<string, string> = {
    Expansion: "bg-econ-green text-white",
    Stagnation: "bg-econ-amber text-white",
    Recession: "bg-econ-red text-white",
    Recovery: "bg-blue-500 text-white",
    Volatile: "bg-purple-500 text-white",
  };
  const cls = colors[regime] ?? "bg-gray-500 text-white";
  return <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${cls}`}>{regime}</span>;
}

export function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[severity] ?? "bg-gray-400"}`} />;
}
