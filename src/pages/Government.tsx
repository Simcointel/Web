import { useState, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { FileText, AlertCircle } from "lucide-react";

export function GovernmentPage() {
  const [realm] = useSharedRealm();
  
  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Government Contracts</h1>
            <p className="text-xs text-surface-400">Official government orders and contracts</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 dark:border-amber-800 p-8 bg-amber-50 dark:bg-amber-900/10 text-center">
        <AlertCircle size={48} className="mx-auto text-amber-600 mb-4" />
        <h2 className="text-lg font-bold text-amber-700 dark:text-amber-500 mb-2">Coming Soon</h2>
        <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md mx-auto">
          Government contracts data is not currently available through the SimCompanies API. 
          This feature will be added once official API support is available.
        </p>
        <p className="text-xs text-amber-500 dark:text-amber-500 mt-4">
          Note: The SimCompanies.com API v3 does not currently expose government contract or exchange rate endpoints.
        </p>
      </div>
    </div>
  );
}
