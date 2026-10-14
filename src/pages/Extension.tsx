import { useState, useEffect } from "react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { Download, Chrome, Globe, Shield, Zap, BarChart3, Copy, Check, Key } from "lucide-react";
import { getPairingCode, isExtensionAvailable } from "../services/extensionBridge";

export function ExtensionPage() {
  usePageTitleKey('extension');
  const [pairingCode, setPairingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'installed' | 'not-installed'>('checking');

  useEffect(() => {
    setPairingCode(getPairingCode());
    isExtensionAvailable().then(available => {
      setExtensionStatus(available ? 'installed' : 'not-installed');
    });
  }, []);

  const copyPairingCode = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pairingCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Pairing Code</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Enter this code in the extension popup to link your company data with the Corporate Suite dashboard.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg">
            <Key size={16} className="text-brand-600 shrink-0" />
            <code className="text-sm font-mono font-bold text-surface-800 dark:text-surface-200 truncate">{pairingCode}</code>
          </div>
          <button
            onClick={copyPairingCode}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Extension Status</h2>
          {extensionStatus === 'checking' && (
            <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
              Checking
            </span>
          )}
          {extensionStatus === 'installed' && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-widest">
              Detected
            </span>
          )}
          {extensionStatus === 'not-installed' && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded text-[10px] font-bold uppercase tracking-widest">
              Not Detected
            </span>
          )}
        </div>
        {extensionStatus === 'installed' && (
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            Extension detected. You can use the "Import from Extension" feature in the Corporate Suite.
          </p>
        )}
        {extensionStatus === 'not-installed' && (
          <p className="text-sm text-surface-500">
            Extension not detected on this page. Make sure the extension is installed and active, then refresh.
          </p>
        )}
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
