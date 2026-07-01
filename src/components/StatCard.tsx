import React from "react";
import { Tooltip } from "./Layout";

export function StatCard({ title, value, subtitle, color, icon, trend, trendLabel }: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string | React.ReactNode;
  trend?: number;
  trendLabel?: string;
}) {
  const isTrendPositive = trend && trend > 0;

  return (
    <div className={`card p-5 border-l-4 ${color ?? "border-l-brand-500"} hover:translate-y-[-2px] transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
             <p className="stat-label">{title}</p>
             {title === "Economic Health" && (
                <Tooltip text="Aggregate measure of production volume, company valuations, and employment levels.">
                   <svg className="w-3 h-3 text-surface-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </Tooltip>
             )}
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="stat-value text-surface-900 dark:text-white">{value}</h4>
            {(trend !== undefined || trendLabel !== undefined) && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTrendPositive ? "bg-econ-green/10 text-econ-green" : trend && trend < 0 ? "bg-econ-red/10 text-econ-red" : "bg-surface-100 text-surface-600"}`}>
                {trendLabel ?? `${isTrendPositive ? "+" : ""}${trend}%`}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] font-medium text-surface-400 dark:text-surface-500 mt-1 uppercase tracking-wider">{subtitle}</p>}
        </div>
        {icon && (
          <div className="text-surface-300 dark:text-surface-700">
            {typeof icon === "string" ? (
              icon.startsWith("M") ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              ) : (
                <span className="text-xl opacity-50">{icon}</span>
              )
            ) : icon}
          </div>
        )}
      </div>
    </div>
  );
}
