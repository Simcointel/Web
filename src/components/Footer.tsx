export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">SI</span>
            SimcoIntel &mdash; Economic Intelligence Platform
          </div>
          <div className="text-xs text-gray-400">
            Data sourced from SimcoTools API &middot; Deterministic analysis &middot; v1.0
          </div>
        </div>
      </div>
    </footer>
  );
}
