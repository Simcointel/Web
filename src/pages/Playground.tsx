import { useState } from "react";
import { Section } from "../components/Layout";
import { apiUrl } from "../config";

const API_BASE = apiUrl("/public");

const presetEndpoints = [
  { label: "Dashboard", url: `${API_BASE}/dashboard`, method: "GET" },
  { label: "Macro (r0)", url: `${API_BASE}/macro?realm=0`, method: "GET" },
  { label: "Indexes (r0)", url: `${API_BASE}/indexes?realm=0&limit=10`, method: "GET" },
  { label: "Inflation (r0)", url: `${API_BASE}/inflation?realm=0&limit=10`, method: "GET" },
  { label: "Events (critical)", url: `${API_BASE}/events?realm=0&severity=critical&limit=5`, method: "GET" },
  { label: "Alerts (r0)", url: `${API_BASE}/alerts?realm=0&limit=5`, method: "GET" },
  { label: "Sectors", url: `${API_BASE}/sectors`, method: "GET" },
  { label: "Correlations", url: `${API_BASE}/correlations`, method: "GET" },
  { label: "Export CSV", url: `${API_BASE}/export/history?realm=0&limit=5&format=csv`, method: "GET" },
  { label: "Widget Health", url: `${API_BASE}/widget/health?realm=0&compact=1`, method: "GET" },
  { label: "Widget Scores", url: `${API_BASE}/widget/scores?realm=0&compact=1`, method: "GET" },
  { label: "Widget Alerts", url: `${API_BASE}/widget/alerts?realm=0&limit=3&compact=1`, method: "GET" },
];

const WIDGET_BASE = `${window.location.origin}${import.meta.env.BASE_URL}widgets`;
const SCRIPT_BASE = `${window.location.origin}${import.meta.env.BASE_URL}`;

const widgetEmbeds = [
  { label: "Health iframe", code: `<iframe src="${WIDGET_BASE}?type=health&realm=0" width="220" height="160" frameborder="0"></iframe>` },
  { label: "Script embed", code: `<script src="${SCRIPT_BASE}widget.js" data-widget="health" data-realm="0" data-refresh="30"></script>` },
  { label: "Alerts iframe", code: `<iframe src="${WIDGET_BASE}?type=alerts&realm=0" width="320" height="120" frameborder="0"></iframe>` },
];

export function PlaygroundPage() {
  const [url, setUrl] = useState(presetEndpoints[0].url);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"json" | "csv">("json");

  const execute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(url);
      if (format === "csv" && url.includes("format=csv")) {
        setResult(await res.text());
      } else {
        setResult(JSON.stringify(await res.json(), null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (result) {
      try { await navigator.clipboard.writeText(result); } catch { /**/ }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">API Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test public API endpoints, view responses, and copy embed codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Section title="Endpoints">
            <div className="space-y-1">
              {presetEndpoints.map((ep) => (
                <button
                  key={ep.label}
                  onClick={() => { setUrl(ep.url); setFormat(ep.url.includes("format=csv") ? "csv" : "json"); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded border transition-colors ${
                    url === ep.url ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] font-bold text-green-600 mr-2">GET</span>
                  {ep.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Section title="Request">
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-lg text-gray-700"
                placeholder="API URL"
              />
              <button
                onClick={execute}
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </Section>

          <Section title="Response">
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}
            {loading && <div className="text-sm text-gray-400 py-4 text-center animate-pulse">Requesting...</div>}
            {result && (
              <div className="relative">
                <pre className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto max-h-96 text-gray-800">
                  <code>{result}</code>
                </pre>
                <button onClick={copyResult} className="absolute top-2 right-2 text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-500 hover:text-gray-700">
                  Copy
                </button>
              </div>
            )}
          </Section>
        </div>
      </div>

      <Section title="Embed Examples" subtitle="Copy-paste these snippets to embed SimcoIntel widgets on your site">
        <div className="space-y-4">
          {widgetEmbeds.map((w, i) => (
            <div key={i} className="card p-4">
              <div className="text-xs text-gray-500 mb-1">{w.label}</div>
              <pre className="text-xs font-mono bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 overflow-x-auto text-gray-800">
                <code>{w.code}</code>
              </pre>
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(w.code); } catch { /**/ } }}
                className="text-xs mt-2 text-blue-600 hover:text-blue-700"
              >
                Copy code
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
