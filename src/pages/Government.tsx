import { useState, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { FileText, AlertCircle, RefreshCw, Table, Package, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtNumber, fmtCurrency } from "../utils/formatters";
import * as dataRepo from "../services/dataRepo";

interface GovernmentOrder {
  id: number;
  name: string;
  description: string;
  resourceId: number;
  quantity: number;
  reward: number;
  deadline: string;
  status: "active" | "completed" | "expired";
}

interface GovernmentOrdersReport {
  t: string;
  r: number;
  orders: GovernmentOrder[];
}

export function GovernmentPage() {
  const [realm] = useSharedRealm();
  usePageTitleKey('government');
  const [orders, setOrders] = useState<GovernmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get from public export (GitHub data repo) first - no API load
      const publicData = await dataRepo.rawFetch<GovernmentOrder[]>(`public/realm-${realm}/government-orders.json`);
      if (publicData && Array.isArray(publicData) && publicData.length > 0) {
        setOrders(publicData);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
        return;
      }
      
      // Fallback: try to fetch from backend compute endpoint
      const computeResponse = await fetch(`/api/actions/government-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realm })
      });
      if (computeResponse.ok) {
        const result = await computeResponse.json();
        if (result.ok && result.report?.orders) {
          setOrders(result.report.orders);
          setLastUpdated(new Date().toLocaleString());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [realm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-active"><CheckCircle size={12} /> Active</span>;
      case 'completed':
        return <span className="badge badge-completed"><CheckCircle size={12} /> Completed</span>;
      case 'expired':
        return <span className="badge badge-expired"><XCircle size={12} /> Expired</span>;
      default:
        return <span className="badge badge-unknown"><AlertTriangle size={12} /> {status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl mx-auto">
      <PageHeader
        title="Government Orders"
        subtitle="Official government contracts and orders"
        icon={<FileText size={18} />}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600"
        realm={realm}
        onRealmChange={() => {}}
      >
        <button onClick={fetchOrders} disabled={loading} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </PageHeader>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 p-4 bg-rose-50 dark:bg-rose-900/10">
          <p className="text-sm font-bold text-rose-600">{error}</p>
          <button onClick={fetchOrders} className="btn btn-sm btn-secondary mt-2">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-l-amber-500">
          <span className="metric-label">Total Orders</span>
          <span className="metric-value">{orders.length}</span>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <span className="metric-label">Active</span>
          <span className="metric-value text-emerald-600">{orders.filter(o => o.status === 'active').length}</span>
        </div>
        <div className="card p-4 border-l-4 border-l-blue-500">
          <span className="metric-label">Completed</span>
          <span className="metric-value text-blue-600">{orders.filter(o => o.status === 'completed').length}</span>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-500">
          <span className="metric-label">Expired</span>
          <span className="metric-value text-rose-600">{orders.filter(o => o.status === 'expired').length}</span>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-surface-400 mb-4">Last updated: {lastUpdated}</p>
      )}

      <div className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="mx-auto text-amber-600 animate-spin mb-4" />
            <p className="text-surface-400">Loading government orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-amber-600 mb-4" />
            <h2 className="text-lg font-bold text-amber-700 dark:text-amber-500 mb-2">No Orders Found</h2>
            <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md mx-auto">
              No government orders available for this realm.
            </p>
            <button onClick={fetchOrders} className="btn btn-secondary mt-4">Refresh</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900 text-surface-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Resource</th>
                  <th className="text-right px-4 py-3">Quantity</th>
                  <th className="text-right px-4 py-3">Reward</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                    <td className="px-4 py-3">
                      <div className="font-bold">{order.name}</div>
                      <div className="text-[10px] text-surface-400">ID: {order.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.resourceId}</div>
                      <div className="text-[10px] text-surface-400 line-clamp-1">{order.description}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{fmtNumber(order.quantity)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">{fmtCurrency(order.reward)}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      {formatDate(order.deadline)}
                      {order.status === 'active' && new Date(order.deadline) < new Date() && (
                        <span className="badge badge-expired ml-2">Overdue</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge component
const badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
    {children}
  </span>
);

const badgeStyles = {
  badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
  badge_active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  badge_completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  badge_expired: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  badge_unknown: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  badge_overdue: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};
