import { LoadingState } from "./States";

import React from "react";

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function CardGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  }[cols as 1|2|3|4|5] || "grid-cols-1 md:grid-cols-3";

  return <div className={`grid ${gridCols} gap-6`}>{children}</div>;
}

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-lg bg-surface-900 px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-900" />
      </div>
    </div>
  );
}
