export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Privacy Policy</h1>
      <p className="text-sm text-surface-500">Last updated: October 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Overview</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          SimcoIntel operates a browser extension and website. This policy explains what data we collect, how we use it, and your rights.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Data We Collect</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          <strong>Browser Storage (chrome.storage.local):</strong>
        </p>
        <ul className="list-disc pl-6 text-sm text-surface-600 dark:text-surface-400 space-y-1">
          <li>Selected realm number (0 or 1)</li>
          <li>Company data synced from SimCompanies (ID, name, level, rank, value, buildings, workers, AO)</li>
          <li>Pairing code (UUID generated locally)</li>
          <li>Price alert history (item name, quality, price, discount %, timestamp)</li>
        </ul>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          <strong>All data stays in your browser.</strong> We do not operate servers. No data is transmitted to us.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Data We Do NOT Collect</h2>
        <ul className="list-disc pl-6 text-sm text-surface-600 dark:text-surface-400 space-y-1">
          <li>No personal information (name, email, address)</li>
          <li>No browsing history</li>
          <li>No cookies</li>
          <li>No analytics or tracking</li>
          <li>No account registration</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Network Requests</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          The extension makes <strong>GET-only</strong> requests to:
        </p>
        <ul className="list-disc pl-6 text-sm text-surface-600 dark:text-surface-400 space-y-1">
          <li><code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">raw.githubusercontent.com/SimcoIntel/Data</code> — public market data</li>
          <li><code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">www.simcompanies.com</code> — reads page content (no POST, no automation)</li>
        </ul>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          We never send data to SimCompanies servers. No POST, PUT, or DELETE requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Third-Party Services</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          We do not use any third-party analytics, advertising, or tracking services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Data Retention</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          All data is stored locally in your browser. Clearing browser data or uninstalling the extension permanently deletes everything.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Children's Privacy</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          Our extension is not directed at children under 13. We do not knowingly collect data from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Changes to This Policy</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          We may update this policy. Changes will be posted on this page with an updated date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-surface-800 dark:text-surface-200">Contact</h2>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          For questions, open an issue at <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">github.com/SimcoIntel/Web</code>.
        </p>
      </section>
    </div>
  );
}
