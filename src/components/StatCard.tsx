import type { ReactNode } from "react";

export function StatCard({
  title, value, subtitle, trend, icon, color, children, className = "",
}: {
  title: string;
  value?: ReactNode;
  subtitle?: string;
  trend?: { up: boolean; label: string };
  icon?: string;
  color?: string;
  children?: ReactNode;
  className?: string;
}) {
  const accent = color ?? "border-l-blue-500";
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.replace("border-l-", "") ? `bg-${accent.replace("border-l-", "")}` : "bg-blue-500"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="stat-label mb-1">{title}</div>
            {value !== undefined && <div className="stat-value">{value as ReactNode}</div>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            {trend && (
              <span className={`inline-flex items-center gap-1 text-xs mt-1.5 ${trend.up ? "text-econ-green" : "text-econ-red"}`}>
                {trend.up ? "\u2191" : "\u2193"} {trend.label}
              </span>
            )}
          </div>
          {icon && <span className="text-2xl opacity-20">{icon}</span>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
