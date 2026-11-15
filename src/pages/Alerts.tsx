import { useEffect, useState } from "react";
import { EmptyState } from "../components/States";
import { Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";

import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fetchPublicApi } from "../services/dataRepo";

interface Alert {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  realm?: number;
}

interface AlertsResponse {
  alerts: Alert[];
  generatedAt: string;
}

export function AlertsPage() {
  usePageTitleKey('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicApi<AlertsResponse>("/api/public/alerts?realm=0");
        setAlerts(data.alerts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alerts");
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle size={16} className="text-amber-600" />;
      case "success": return <CheckCircle size={16} className="text-emerald-600" />;
      case "error": return <AlertTriangle size={16} className="text-rose-600" />;
      default: return <Info size={16} className="text-brand-600" />;
    }
  };

  const getBg = (type: Alert["type"]) => {
    switch (type) {
      case "warning": return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "success": return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
      case "error": return "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800";
      default: return "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800";
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Event Log"
        subtitle={loading ? "Loading..." : alerts.length === 0 ? "No alerts" : `${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
        icon={<Bell size={18} />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600"
        realm={0}
        onRealmChange={() => {}}
      />
      
      {loading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-16">
          <EmptyState message={error} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16">
          <EmptyState message="No alerts at this time." />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border ${getBg(alert.type)}`}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">{getIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-surface-900 dark:text-surface-100">{alert.title}</h4>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    {alert.realm !== undefined && <span>Realm {alert.realm}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}