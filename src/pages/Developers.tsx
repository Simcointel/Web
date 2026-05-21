import { Section } from "../components/Layout";
import { useState } from "react";
import { apiUrl } from "../config";

const PUBLIC = apiUrl("/public");

const endpoints = [
  { path: "/api/public/status", method: "GET", desc: "Public API status, version, endpoint list, rate limit info" },
  { path: "/api/public/dashboard", method: "GET", desc: "Latest dashboard summaries (scores, regime, alerts) per realm" },
  { path: "/api/public/macro?realm=0", method: "GET", desc: "Latest macro snapshot for a realm — companies value, indexes, inflation" },
  { path: "/api/public/indexes?realm=0&limit=30", method: "GET", desc: "Price indexes (CPI, Core CPI, GDP) — paginated" },
  { path: "/api/public/inflation?realm=0&limit=30", method: "GET", desc: "Inflation rates — paginated" },
  { path: "/api/public/events?realm=0&limit=50", method: "GET", desc: "Unified event feed with severity/category filters" },
  { path: "/api/public/alerts?realm=0&limit=20", method: "GET", desc: "Recent alert events" },
  { path: "/api/public/sectors", method: "GET", desc: "Sector intelligence across all realms" },
  { path: "/api/public/correlations", method: "GET", desc: "Cross-category correlation coefficients" },
  { path: "/api/public/export/:dataset?format=csv", method: "GET", desc: "Export any dataset as JSON or CSV" },
];

const datasets = [
  { name: "dashboard", desc: "Latest dashboard summaries", example: `${PUBLIC}/export/dashboard` },
  { name: "macro", desc: "Latest macro snapshot", example: `${PUBLIC}/export/macro?realm=0` },
  { name: "history", desc: "Macro history entries", example: `${PUBLIC}/export/history?realm=0&limit=120` },
  { name: "indexes", desc: "Price index series", example: `${PUBLIC}/export/indexes?realm=0&limit=60` },
  { name: "inflation", desc: "Inflation rate series", example: `${PUBLIC}/export/inflation?realm=0&limit=60` },
  { name: "correlations", desc: "Correlation data", example: `${PUBLIC}/export/correlations` },
  { name: "anomalies", desc: "Anomaly events", example: `${PUBLIC}/export/anomalies` },
  { name: "divergence", desc: "Divergence signals", example: `${PUBLIC}/export/divergence` },
  { name: "contagion", desc: "Contagion risk", example: `${PUBLIC}/export/contagion` },
  { name: "sectors", desc: "Sector intelligence", example: `${PUBLIC}/export/sectors` },
];

const curlExamples = [
  { label: "Get dashboard", cmd: `curl ${PUBLIC}/dashboard` },
  { label: "Get macro data", cmd: `curl "${PUBLIC}/macro?realm=0"` },
  { label: "Export as CSV", cmd: `curl "${PUBLIC}/export/history?realm=0&limit=10&format=csv"` },
  { label: "Filter events", cmd: `curl "${PUBLIC}/events?realm=0&severity=critical&limit=5"` },
];

const jsExamples = [
  {
    label: "Fetch dashboard",
    code: `const res = await fetch("${PUBLIC}/dashboard");
const json = await res.json();
console.log(json.data);`,
  },
  {
    label: "Export CSV",
    code: `const res = await fetch("${PUBLIC}/export/indexes?realm=0&format=csv");
const csv = await res.text();
// Parse with PapaParse or split by lines`,
  },
];

export function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<string>("endpoints");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /**/ }
  };

  const tabs = [
    { key: "endpoints", label: "API Endpoints" },
    { key: "export", label: "Data Export" },
    { key: "curl", label: "cURL Examples" },
    { key: "js", label: "JavaScript" },
    { key: "limits", label: "Rate Limits" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Developer Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Free, open, rate-limited public API for economic intelligence data</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              activeTab === t.key
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "endpoints" && (
        <Section title="Public API Endpoints" subtitle="All endpoints return JSON. Add ?format=csv for CSV export on export endpoints.">
          <div className="card divide-y divide-gray-100">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 text-sm hover:bg-gray-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{ep.method}</span>
                <div className="min-w-0 flex-1">
                  <code className="text-xs font-mono text-blue-700 break-all">{ep.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeTab === "export" && (
        <Section title="Data Export" subtitle="Available datasets for download as JSON or CSV">
          <div className="space-y-3">
            {datasets.map((d) => (
              <div key={d.name} className="card p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{d.name}</span>
                  <p className="text-xs text-gray-500">{d.desc}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(d.example, `json-${d.name}`)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100"
                  >
                    {copied === `json-${d.name}` ? "Copied!" : "Copy URL"}
                  </button>
                  <a
                    href={`${d.example}&format=csv`}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100"
                  >
                    CSV
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeTab === "curl" && (
        <Section title="cURL Examples" subtitle="Copy-paste ready commands for terminal usage">
          <div className="space-y-4">
            {curlExamples.map((ex, i) => (
              <div key={i} className="card p-4">
                <div className="text-xs text-gray-500 mb-1">{ex.label}</div>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-xs font-mono bg-gray-50 px-3 py-2 rounded flex-1 break-all text-gray-800">{ex.cmd}</code>
                  <button
                    onClick={() => copyToClipboard(ex.cmd, `curl-${i}`)}
                    className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    {copied === `curl-${i}` ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeTab === "js" && (
        <Section title="JavaScript Examples" subtitle="Works in browsers and Node.js (18+)" >
          <div className="space-y-6">
            {jsExamples.map((ex, i) => (
              <div key={i} className="card p-4">
                <div className="text-xs text-gray-500 mb-2">{ex.label}</div>
                <pre className="text-xs font-mono bg-gray-50 px-4 py-3 rounded overflow-x-auto text-gray-800 border border-gray-100">
                  <code>{ex.code}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(ex.code, `js-${i}`)}
                  className="text-xs mt-2 text-blue-600 hover:text-blue-700"
                >
                  {copied === `js-${i}` ? "Copied!" : "Copy code"}
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeTab === "limits" && (
        <Section title="Rate Limits & Governance">
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Rate Limiting</h3>
              <p className="text-sm text-gray-600">All public API endpoints are rate-limited to <strong>120 requests per minute</strong> per IP address. Response headers include current usage:</p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1 ml-4 list-disc">
                <li><code className="text-blue-700">X-RateLimit-Limit</code> — Maximum requests per window</li>
                <li><code className="text-blue-700">X-RateLimit-Remaining</code> — Requests remaining in current window</li>
                <li><code className="text-blue-700">X-RateLimit-Reset</code> — Unix timestamp when the window resets</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Caching</h3>
              <p className="text-sm text-gray-600">Responses include <code className="text-blue-700">Cache-Control: public, max-age=300</code> headers. Data is pre-computed and served from disk — no realtime calculation overhead.</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">CORS</h3>
              <p className="text-sm text-gray-600">All endpoints have <code className="text-blue-700">Access-Control-Allow-Origin: *</code> enabled. Use directly from browser fetch, curl, or any HTTP client.</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Data Freshness</h3>
              <p className="text-sm text-gray-600">Data is updated every scheduler cycle (~5–15 minutes depending on configuration). Static dataset exports in <code className="text-blue-700">Data/public/</code> are regenerated each cycle.</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Authentication Required</h3>
              <p className="text-sm text-gray-600">The public API is open and free. No API keys, tokens, or accounts needed. Usage is subject to fair-use rate limits.</p>
            </div>
          </div>
        </Section>
      )}

      <Section title="Static Datasets" subtitle="Pre-generated JSON files available via raw GitHub">
        <div className="card p-5">
          <p className="text-sm text-gray-600 mb-3">Datasets are automatically published to <code className="text-blue-700">Data/public/</code> every scheduler cycle. Access them directly via GitHub:</p>
          <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-800 space-y-1">
            <div>https://raw.githubusercontent.com/{`{org}`}/SimcoIntel/main/Data/public/manifest.json</div>
            <div>https://raw.githubusercontent.com/{`{org}`}/SimcoIntel/main/Data/public/dashboard.json</div>
            <div>https://raw.githubusercontent.com/{`{org}`}/SimcoIntel/main/Data/public/realm-0/macro.json</div>
            <div>https://raw.githubusercontent.com/{`{org}`}/SimcoIntel/main/Data/public/realm-0/history.json</div>
            <div>https://raw.githubusercontent.com/{`{org}`}/SimcoIntel/main/Data/public/correlations.json</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
