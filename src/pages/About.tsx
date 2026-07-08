import { useEffect } from "react";
import { methodology } from "../data/methodology";
import { Section } from "../components/Layout";
import { Info } from "lucide-react";

export function AboutPage() {
  useEffect(() => { document.title = "SimCo Intel - About"; }, []);
  return (
    <div className="space-y-6 max-w-3xl animate-slide-up">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
          <Info size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Methodology & Interpretation Guide</h1>
          <p className="text-xs text-surface-400">How scores, indexes & indicators are calculated</p>
        </div>
      </div>

      <Section title="Composite Scores" subtitle="Five 0–100 scores summarizing economic health">
        <div className="space-y-4">
          {[methodology.economicHealth, methodology.marketSentiment, methodology.stability, methodology.inflationPressure, methodology.systemicRisk].map((m) => (
            <div key={m.title} className="card p-5 space-y-3">
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">{m.title}</h3>
              <p className="text-xs text-surface-500 leading-relaxed">{m.summary}</p>
              <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 border border-surface-100 dark:border-surface-800">
                <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Formula</span>
                <p className="text-xs text-surface-700 dark:text-surface-300 mt-0.5 font-semibold">{m.formula}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Interpretation</span>
                <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{m.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Economic Regimes">
        <div className="card p-5 space-y-4">
          <p className="text-xs text-surface-500 leading-relaxed">{methodology.regime.summary}</p>
          <div className="space-y-3">
            {methodology.regime.types.map((t) => (
              <div key={t.name} className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  t.name === "Expansion" ? "bg-emerald-500" : t.name === "Recession" ? "bg-rose-500" : t.name === "Recovery" ? "bg-blue-500" : t.name === "Volatile" ? "bg-violet-500" : "bg-amber-500"
                }`} />
                <div>
                  <span className="text-sm font-bold text-surface-900 dark:text-white">{t.name}</span>
                  <p className="text-xs text-surface-500 leading-relaxed">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="CPI & Inflation">
        <div className="card p-5 space-y-3">
          <p className="text-xs text-surface-500 leading-relaxed">{methodology.cpiInflation.summary}</p>
          <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 border border-surface-100 dark:border-surface-800">
            <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Method</span>
            <p className="text-xs text-surface-700 dark:text-surface-300 mt-0.5 font-semibold">{methodology.cpiInflation.method}</p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Interpretation</span>
            <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{methodology.cpiInflation.interpretation}</p>
          </div>
        </div>
      </Section>

      <Section title="GDP & Economic Output">
        <div className="card p-5 space-y-3">
          <p className="text-xs text-surface-500 leading-relaxed">{methodology.gdpTracking.summary}</p>
          <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 border border-surface-100 dark:border-surface-800">
            <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Method</span>
            <p className="text-xs text-surface-700 dark:text-surface-300 mt-0.5 font-semibold">{methodology.gdpTracking.method}</p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-surface-400">Interpretation</span>
            <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{methodology.gdpTracking.interpretation}</p>
          </div>
        </div>
      </Section>

      <Section title="Data Sources">
        <div className="card p-5 space-y-4">
          <p className="text-xs text-surface-500 leading-relaxed">{methodology.dataSources.note}</p>
          <div className="space-y-4">
            {methodology.dataSources.sources.map((s) => (
              <div key={s.name}>
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">{s.name}</h3>
                <p className="text-xs text-surface-500 leading-relaxed mt-0.5">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
