import React from "react";
import { ChevronRight } from "lucide-react";

export function Section({ title, subtitle, children, actions, icon: Icon, color }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode; icon?: React.ElementType; color?: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-xl ${color ? `${color.replace('text-', 'bg-')}/10 ${color}` : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'}`}>
               <Icon size={20} />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
               {title}
            </h2>
            {subtitle && <p className="text-xs text-surface-400 font-semibold uppercase tracking-wide mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        {children}
      </div>
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
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 bg-surface-900 dark:bg-white px-3 py-2 text-center text-[10px] font-black text-white dark:text-surface-900 rounded-xl opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1 z-50 uppercase tracking-widest scale-95 group-hover:scale-100">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-900 dark:border-t-white" />
      </div>
    </div>
  );
}
