import { useEffect } from "react";
import { EmptyState } from "../components/States";
import { Bell } from "lucide-react";

import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";

export function AlertsPage() {
  usePageTitleKey('alerts');

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Event Log"
        subtitle="Event data pending backend integration"
        icon={<Bell size={18} />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600"
        realm={0}
        onRealmChange={() => {}}
      />
      <div className="py-16"><EmptyState message="No event data available yet." /></div>
    </div>
  );
}