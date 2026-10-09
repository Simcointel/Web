import { useState, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { FileText, AlertCircle } from "lucide-react";

import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";

export function GovernmentPage() {
  const [realm] = useSharedRealm();
  usePageTitleKey('government');

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl mx-auto">
      <PageHeader
        title="Government Contracts"
        subtitle="Official government orders and contracts"
        icon={<FileText size={18} />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600"
        realm={realm}
        onRealmChange={() => {}}
      />

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
