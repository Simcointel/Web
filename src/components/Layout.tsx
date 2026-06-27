import React from "react";

export function Section({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-2">
        <div>
          <h2 className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-widest">{title}</h2>
          {subtitle && <p className="text-[10px] text-surface-500 dark:text-surface-600 font-mono mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
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

  return <div className={`grid ${gridCols} gap-4`}>{children}</div>;
}

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-center text-[10px] font-bold text-surface-900 dark:text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50 uppercase tracking-tighter">
        {text}
      </div>
    </div>
  );
}
