import { useEffect } from "react";
import { EmptyState } from "../components/States";
import { Bell } from "lucide-react";

export function AlertsPage() {
  useEffect(() => {
    document.title = "Event Logs - SimcoIntel";
  }, []);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Bell size={18} className="text-amber-600" /></div>
        <div><h1 className="text-lg font-bold">Event Log</h1><p className="text-xs text-surface-400">Event data pending backend integration</p></div>
      </div>
      <div className="py-16"><EmptyState message="No event data available yet." /></div>
    </div>
  );
}