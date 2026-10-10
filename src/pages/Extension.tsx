import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitleKey";
import { Download, Chrome, Globe, Shield, Zap, BarChart3 } from "lucide-react";

export function ExtensionPage() {
  usePageTitleKey('extension');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Browser Extension"
        subtitle="Real-time SimCo market data in your browser"
        icon={<Chrome size={18} />}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600"
      />

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">SimcoIntel Extension</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Get real-time SimCompanies market data without leaving your browser. The extension shows top profitable
          resources, retail saturation, and realm dashboard scores in a compact popup.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 space-y-2">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300">Auto-Refresh</h3>
            <p className="text-xs text-surface-500">Updates every 5 minutes via background service worker</p>
          </div>
          <div className="card p-4 space-y-2">
            <BarChart3 size={20} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300">Live Data</h3>
            <p className="text-xs text-surface-500">Top movers, retail saturation, and realm scores</p>
          </div>
          <div className="card p-4 space-y-2">
            <Shield size={20} className="text-blue-500" />
            <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300">Privacy</h3>
            <p className="text-xs text-surface-500">No tracking, no accounts. Data from public GitHub CDN</p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Install</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <Chrome size={20} className="text-brand-500 mt-0.5 shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300">Chrome / Edge / Brave</h3>
              <ol className="text-xs text-surface-500 space-y-1 list-decimal list-inside">
                <li>Download the extension zip</li>
                <li>Unzip the file</li>
                <li>Open <code className="bg-surface-200 dark:bg-surface-800 px-1 rounded">chrome://extensions</code></li>
                <li>Enable Developer mode</li>
                <li>Click Load unpacked and select the folder</li>
              </ol>
              <a
                href="https://github.com/SimcoIntel/Web/raw/main/extension/simcointel-extension.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors"
              >
                <Download size={14} />
                Download for Chrome
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <Globe size={20} className="text-orange-500 mt-0.5 shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-surface-700 dark:text-surface-300">Firefox</h3>
              <ol className="text-xs text-surface-500 space-y-1 list-decimal list-inside">
                <li>Download the extension zip</li>
                <li>Unzip the file</li>
                <li>Open <code className="bg-surface-200 dark:bg-surface-800 px-1 rounded">about:debugging</code></li>
                <li>Click This Firefox → Load Temporary Add-on</li>
                <li>Select the manifest.json from the folder</li>
              </ol>
              <a
                href="https://github.com/SimcoIntel/Web/raw/main/extension/simcointel-extension.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Download size={14} />
                Download for Firefox
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Features</h2>
        <ul className="text-sm text-surface-600 dark:text-surface-400 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Popup dashboard with top 5 most profitable resources
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Biggest losses and retail saturation overview
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Realm selector (Realm 0 / Realm 1)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Content overlay on SimCompanies pages
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            Badge count showing resources with pricing data
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            No tracking, no accounts — data from public GitHub CDN
          </li>
        </ul>
      </div>
    </div>
  );
}
