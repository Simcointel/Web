export interface MetricProps {
  label: string;
  value: string | number;
  highlight?: string;
  className?: string;
}

export function Metric({ label, value, highlight, className }: MetricProps) {
  return (
    <div className={`flex justify-between items-center py-1 ${className || ""}`}>
      <span className="text-surface-500 font-semibold">{label}</span>
      <span className={`font-bold tabular-nums ${highlight || ""}`}>{value}</span>
    </div>
  );
}