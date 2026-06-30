import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-sky-600 rounded flex items-center justify-center text-white text-[9px] font-black italic">
               SI
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
               SimcoIntel — Economic Intelligence Platform
            </p>
          </div>
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center md:text-right leading-relaxed">
            Sourced via SimcoTools API &middot; Deterministic Vectors &middot; v2.5.0
          </div>
        </div>
      </div>
    </footer>
  );
}
