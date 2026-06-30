import React from 'react';
import { methodology } from "../data/methodology";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { BookOpen, Info, BarChart3, Globe, Database, ShieldCheck } from "lucide-react";

export function AboutPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
          Intelligence.<span className="text-sky-600">Methodology</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-2xl">
           A comprehensive guide to the algorithmic models and data processing vectors powering the SimcoIntel matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg text-sky-600">
                     <BarChart3 size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Composite Scoring Model</h2>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {[
                     methodology.economicHealth,
                     methodology.marketSentiment,
                     methodology.stability,
                     methodology.inflationPressure,
                     methodology.systemicRisk
                  ].map((m) => (
                     <Card key={m.title} title={m.title} icon={Info}>
                        <div className="space-y-4">
                           <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              {m.summary}
                           </p>
                           <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Algorithmic Vector</p>
                              <p className="text-xs font-mono font-bold text-sky-600">{m.formula}</p>
                           </div>
                           <div className="pt-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Intelligence Interpretation</p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 italic">
                                 "{m.interpretation}"
                              </p>
                           </div>
                        </div>
                     </Card>
                  ))}
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                     <Globe size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Market Regime Tracking</h2>
               </div>
               <Card title="Phase Determination Logic" icon={ShieldCheck}>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                     {methodology.regime.summary}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {methodology.regime.types.map((t) => (
                        <div key={t.name} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                           <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                              t.name === "Expansion" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                              t.name === "Recession" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                              t.name === "Recovery" ? "bg-sky-500" : "bg-amber-500"
                           }`} />
                           <div>
                              <span className="text-xs font-black uppercase tracking-tight">{t.name}</span>
                              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{t.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </section>
         </div>

         <div className="lg:col-span-4 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                     <Database size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Data Sourcing</h2>
               </div>
               <Card className="bg-slate-900 text-white border-none relative overflow-hidden">
                  <Database className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
                  <div className="relative z-10 space-y-8">
                     {methodology.dataSources.sources.map((s) => (
                        <div key={s.name}>
                           <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mb-2">{s.name}</p>
                           <p className="text-sm font-medium opacity-80 leading-relaxed italic">{s.description}</p>
                        </div>
                     ))}
                     <div className="pt-6 border-t border-white/10">
                        <Badge variant="neutral" className="bg-white/10 border-white/20 text-white uppercase text-[9px]">
                           Protocol v2.5.0
                        </Badge>
                     </div>
                  </div>
               </Card>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                     <BookOpen size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Glossary</h2>
               </div>
               <Card title="KPI Dictionary" icon={Info}>
                  <div className="space-y-4">
                     <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">PPHPL</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Profit Per Hour Per Level. The primary metric for retail optimization.</p>
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">VWAP</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Volume Weighted Average Price. A measure of the average price a resource has traded at over time.</p>
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase text-slate-400">Regime</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">The current state of the global economy (Expansion, Recession, etc).</p>
                     </div>
                  </div>
               </Card>
            </section>
         </div>
      </div>
    </div>
  );
}
