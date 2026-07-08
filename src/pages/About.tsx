import { useEffect } from "react";
import { methodology } from "../data/methodology";
import { Section } from "../components/Layout";

export function AboutPage() {
  useEffect(() => {
    document.title = "SimCo Intel - About";
  }, []);
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Methodology &amp; Interpretation Guide</h1>
        <p className="text-sm text-gray-500 mt-1">How SimcoIntel scores, indexes, and indicators are calculated</p>
      </div>

      <Section title="Composite Scores" subtitle="Five 0–100 scores that summarize economic health">
        <div className="space-y-6">
          {[methodology.economicHealth, methodology.marketSentiment, methodology.stability, methodology.inflationPressure, methodology.systemicRisk].map((m) => (
            <div key={m.title} className="card p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{m.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{m.summary}</p>
              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Formula</span>
                <p className="text-sm text-gray-700 mt-0.5">{m.formula}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Interpretation</span>
                <p className="text-sm text-gray-700 mt-0.5">{m.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Economic Regimes">
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-4">{methodology.regime.summary}</p>
          <div className="space-y-3">
            {methodology.regime.types.map((t) => (
              <div key={t.name} className="flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  t.name === "Expansion" ? "bg-econ-green" : t.name === "Recession" ? "bg-econ-red" : t.name === "Recovery" ? "bg-blue-500" : t.name === "Volatile" ? "bg-purple-500" : "bg-econ-amber"
                }`} />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t.name}</span>
                  <p className="text-sm text-gray-600">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="CPI &amp; Inflation">
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-2">{methodology.cpiInflation.summary}</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Method</span>
            <p className="text-sm text-gray-700 mt-0.5">{methodology.cpiInflation.method}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Interpretation</span>
            <p className="text-sm text-gray-700 mt-0.5">{methodology.cpiInflation.interpretation}</p>
          </div>
        </div>
      </Section>

      <Section title="GDP &amp; Economic Output Tracking">
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-2">{methodology.gdpTracking.summary}</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Method</span>
            <p className="text-sm text-gray-700 mt-0.5">{methodology.gdpTracking.method}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase">Interpretation</span>
            <p className="text-sm text-gray-700 mt-0.5">{methodology.gdpTracking.interpretation}</p>
          </div>
        </div>
      </Section>

      <Section title="Data Sources">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-4">{methodology.dataSources.note}</p>
          <div className="space-y-4">
            {methodology.dataSources.sources.map((s) => (
              <div key={s.name}>
                <h3 className="text-sm font-medium text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
