import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { PageHeader } from "../components/ui/Common";
import { LoadingState, ErrorState } from "../components/States";
import {
  ExternalLink,
  Copy,
  Server,
  Database,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  HeartPulse,
  Activity,
  Download,
} from "lucide-react";

const SPEC_URL = "/api/openapi.json";
// Base URL is the origin (without /api path) - for display and copy
const API_BASE_URL = (() => {
  const envBase = import.meta.env.VITE_API_BASE || "/api";
  // If it's a full URL, extract origin; if it's a path like /api, use window.location.origin
  if (envBase.startsWith("http")) {
    try {
      return new URL(envBase).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
})();

// Tags to exclude from public API documentation
const EXCLUDED_TAGS = new Set([
  "Admin",
  "Actions",
  "Config",
  "Snapshots",
  "Archives",
  "Cron",
  "Sync",
]);

// Category configuration for display
const CATEGORIES = [
  { name: "Public", description: "Rate-limited public endpoints for macro, indexes, inflation, resources", icon: Globe, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { name: "Macro", description: "Macro economic data: history, indexes, inflation, phases, latest", icon: TrendingUp, color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  { name: "Health", description: "System health checks", icon: HeartPulse, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  { name: "Status", description: "System status, scheduler, failures", icon: Activity, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
  { name: "Export", description: "Data export in JSON/CSV: macro, history, indexes, inflation, margins", icon: Download, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
] as const;

// Icons for category display
const ICON_MAP: Record<string, typeof Globe> = {
  Public: Globe,
  Macro: TrendingUp,
  Health: HeartPulse,
  Status: Activity,
  Export: Download,
};

function filterSpec(spec: Record<string, unknown>): Record<string, unknown> {
  if (!spec || typeof spec !== "object") return spec;

  const cloned = JSON.parse(JSON.stringify(spec)) as {
    paths?: Record<string, Record<string, unknown>>;
    tags?: Array<{ name: string; description?: string }>;
    components?: Record<string, unknown>;
  };

  // Filter paths - remove endpoints with excluded tags
  if (cloned.paths) {
    for (const [path, methods] of Object.entries(cloned.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const op = operation as { tags?: string[]; summary?: string };
        if (op.tags && op.tags.some((tag) => EXCLUDED_TAGS.has(tag))) {
          delete methods[method];
        }
      }
      // Remove path if all methods were filtered
      if (Object.keys(methods).length === 0) {
        delete cloned.paths[path];
      }
    }
  }

  // Filter tags
  if (cloned.tags) {
    cloned.tags = cloned.tags.filter((tag) => !EXCLUDED_TAGS.has(tag.name));
  }

  return cloned;
}

// Inject custom styles for SwaggerUI
function injectStyles() {
  const styleId = "swagger-custom-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = "swagger-custom-styles";
  style.textContent = `
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info {
      margin: 24px 32px 0;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    .swagger-ui .info .title {
      color: var(--color-text-primary, #111827);
      font-size: 28px;
      font-weight: 700;
    }
    .swagger-ui .info .description {
      color: var(--color-text-secondary, #6b7280);
      margin-top: 12px;
    }
    .swagger-ui .scheme-container {
      background: var(--color-bg-secondary, #f9fafb);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 32px;
    }
    .swagger-ui .opblock {
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      margin: 16px 24px;
    }
    .swagger-ui .opblock.opblock-get { border-color: #10b981; }
    .swagger-ui .opblock-summary { padding: 12px 20px; }
    .swagger-ui .opblock-summary-method {
      border-radius: 6px;
      padding: 4px 12px;
      font-weight: 600;
      font-size: 12px;
    }
    .swagger-ui .opblock-summary-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
    }
    .swagger-ui .opblock-description-wrapper { padding: 12px 20px 0; }
    .swagger-ui .btn.try-out {
      background: var(--color-brand, #4f46e5);
      border-color: var(--color-brand, #4f46e5);
      border-radius: 6px;
      padding: 8px 20px;
      font-weight: 600;
    }
    .swagger-ui .btn.try-out:hover {
      background: var(--color-brand-hover, #4338ca);
      border-color: var(--color-brand-hover, #4338ca);
    }
    .swagger-ui .btn.execute {
      background: #10b981;
      border-color: #10b981;
      border-radius: 6px;
      padding: 8px 24px;
      font-weight: 600;
    }
    .swagger-ui .btn.execute:hover {
      background: #059669;
      border-color: #059669;
    }
    .swagger-ui .responses-wrapper { margin: 16px 24px 24px; }
    .swagger-ui .response-col_status { font-weight: 600; }
    .swagger-ui .model-box {
      background: var(--color-bg-secondary, #f9fafb);
      border-radius: 8px;
    }
    .swagger-ui .model-title {
      background: var(--color-bg-tertiary, #f3f4f6);
    }
    @media (prefers-color-scheme: dark) {
      .swagger-ui .info { border-color: var(--color-border-dark, #374151); }
      .swagger-ui .scheme-container { background: var(--color-bg-tertiary-dark, #374151); }
      .swagger-ui .opblock { box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
      .swagger-ui .model-box { background: var(--color-bg-tertiary-dark, #374151); }
      .swagger-ui .model-title { background: var(--color-bg-secondary-dark, #1f2937); }
    }
  `;
  document.head.appendChild(style);
}

export function ApiDocsPage() {
  interface OpenApiSpec {
  paths?: Record<string, Record<string, { tags?: string[] }>>;
  tags?: Array<{ name: string; description?: string }>;
  components?: Record<string, unknown>;
}

const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSpec() {
      try {
        const res = await fetch(SPEC_URL);
        if (!res.ok) {
          throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!cancelled) {
          const filtered = filterSpec(data);
          setSpec(filtered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    fetchSpec();

    return () => {
      cancelled = true;
    };
  }, []);

  // Inject styles when spec loads
  useEffect(() => {
    if (spec) {
      injectStyles();
    }
  }, [spec]);

  const copyBaseUrl = () => {
    navigator.clipboard.writeText(API_BASE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingState text="Loading API documentation..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  // Count endpoints by category
  const endpointCounts = spec && spec.paths
    ? Object.entries(spec.paths as Record<string, Record<string, unknown>>).reduce((acc, [path, methods]) => {
        for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
          const op = operation as { tags?: string[] };
          const tag = op.tags?.[0] || "Other";
          acc[tag] = (acc[tag] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="api-docs-page">
      <PageHeader
        title="API Documentation"
        subtitle="Interactive OpenAPI documentation for SimcoIntel Public API endpoints"
      />

      {/* Base URL & Quick Actions */}
      <div className="mb-6 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <Server className="w-5 h-5 text-brand-600" />
              <span className="font-mono text-sm text-surface-700 dark:text-surface-300">{API_BASE_URL}</span>
            </div>
            <button
              onClick={copyBaseUrl}
              className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              title="Copy base URL"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            {copied && <span className="text-xs text-emerald-600 animate-fade-in">Copied!</span>}
          </div>

          <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>GET only</span>
            </span>
            <span className="mx-1">|</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Rate limited</span>
            </span>
            <span className="mx-1">|</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>CDN cached</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Overview */}
      {spec && spec.paths && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Available Categories</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const count = endpointCounts[cat.name] || 0;
              if (count === 0) return null;
              const Icon = ICON_MAP[cat.name] || Globe;
              return (
                <div
                  key={cat.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cat.color} dark:bg-opacity-30`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="px-2 py-0.5 text-xs bg-white/50 dark:bg-surface-800/50 rounded-full">
                    {count} endpoints
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mb-6 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={`${API_BASE_URL}/openapi.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 bg-surface-50 dark:bg-surface-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Raw OpenAPI JSON</span>
          </a>
          <a
            href={`${API_BASE_URL}/public/status`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 bg-surface-50 dark:bg-surface-800 rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>API Status</span>
          </a>
          <a
            href={`${API_BASE_URL}/public/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 bg-surface-50 dark:bg-surface-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Datasets</span>
          </a>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="api-docs-container">
        {spec && (
          <SwaggerUI
            spec={spec as object}
            deepLinking={true}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            withCredentials={true}
            supportedSubmitMethods={["get"]}
            persistAuthorization={true}
            oauth2RedirectUrl={`${window.location.origin}/oauth2-redirect.html`}
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            defaultModelRendering="example"
            docExpansion="list"
            layout="BaseLayout"
          />
        )}
      </div>
    </div>
  );
}