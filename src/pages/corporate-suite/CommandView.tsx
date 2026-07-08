import React, { useMemo } from "react";
import { Globe, Package, Building2, DollarSign, Zap, Clock } from "lucide-react";
import { KPICard, CheckItem } from "./components";
import { n } from "./types";

export function CommandView({ core, phase, margins, cycles, state, onSync, isSyncing, setState }: any) {
  const marketAlerts = useMemo(() => {
    if (!margins?.resources) return [];
    return (margins.resources as any[]).filter(r => Math.abs(r.marginDelta || 0) > 5).slice(0, 5);
  }, [margins]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-8 space-y-6">
          {state.companyName ? (
             <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 !shadow-none border-surface-200 dark:border-surface-800 bg-brand-50/10 dark:bg-brand-900/5 border-l-4 border-l-brand-600">
                <div className="flex items-center gap-6">
                   {state.companyLogo && <img src={state.companyLogo} className="w-16 h-16 rounded-xl border-2 border-white dark:border-surface-800 shadow-md" alt="Logo" />}
                   <div>
                      <div className="flex items-center gap-3">
                         <h2 className="text-2xl font-bold text-surface-900 dark:text-white leading-tight">{state.companyName}</h2>
                         <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded text-[10px] font-black uppercase tracking-widest border border-brand-200 dark:border-brand-800">LVL {state.companyLevel}</span>
                         {state.companyRank > 0 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800">RANK #{state.companyRank}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">ID #{state.companyId}</span>
                         <div className="w-1 h-1 rounded-full bg-surface-300" />
                         <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Link Established</span>
                         <div className="w-1 h-1 rounded-full bg-surface-300" />
                         <span className={`text-xs font-bold uppercase tracking-widest ${state.onlineStatus === 'Today' || state.onlineStatus === 'Now' ? 'text-emerald-600' : 'text-surface-400'}`}>
                            {state.onlineStatus === 'Now' ? '● Online' : `Seen ${state.onlineStatus}`}
                         </span>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Last Transmission</p>
                   <p className="text-sm font-black text-surface-700 dark:text-surface-300">{state.lastSynced}</p>
                   <button
                     onClick={() => onSync(state.companyId)}
                     disabled={isSyncing}
                     className={`text-[10px] font-bold text-brand-600 uppercase hover:underline mt-2 flex items-center gap-1 ml-auto ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                      <Zap size={10} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Re-Sync'}
                   </button>
                </div>
             </div>
          ) : (
             <div className="card p-10 border-dashed border-2 border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center text-center !shadow-none opacity-50">
                <Globe size={40} className="text-surface-300 mb-4" />
                <h3 className="text-lg font-bold text-surface-400 uppercase tracking-widest">Awaiting Player Link</h3>
                <p className="text-xs text-surface-400 mt-2">Connect your Company ID in the Player Portal to begin.</p>
             </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <KPICard label="Warehouse Value" value={`$${(core.inventoryValue/1000).toFixed(1)}K`} sub="Current Inventory" icon={Package} />
             <KPICard label="Asset Valuation" value={`$${(core.mapValue/1_000_000).toFixed(2)}M`} sub={`${core.totalLevels} Facility Levels`} icon={Building2} />
             <KPICard label="Company Value" value={state.companyValue ? `$${(state.companyValue/1_000_000).toFixed(1)}M` : '--'} sub="Total Player Equity" icon={DollarSign} />
             <KPICard label="Market Regime" value={phase} sub="Global Environment" icon={Globe} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800 text-center">
                <span className="text-[10px] font-bold text-surface-400 uppercase block mb-1">Workers</span>
                <span className="text-xl font-bold tabular-nums">{state.workers?.toLocaleString() || '--'}</span>
             </div>
             <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800 text-center">
                <span className="text-[10px] font-bold text-surface-400 uppercase block mb-1">Gov. Tier</span>
                <span className="text-xl font-bold tabular-nums">{state.governmentTier ?? '--'}</span>
             </div>
             <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800 text-center">
                <span className="text-[10px] font-bold text-surface-400 uppercase block mb-1">Extra Slots</span>
                <span className="text-xl font-bold tabular-nums">+{state.extraSlots || '0'}</span>
             </div>
             <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800 text-center">
                <span className="text-[10px] font-bold text-surface-400 uppercase block mb-1">API AO Ref</span>
                <span className="text-xl font-bold tabular-nums text-rose-600">{(n(state.apiAO)*100).toFixed(1)}%</span>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="card !shadow-none border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                   <h3 className="text-sm font-bold uppercase text-surface-500">Market Volatility</h3>
                </div>
                <div className="divide-y divide-surface-50 dark:divide-surface-800">
                   {marketAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all">
                         <span className="font-bold text-surface-800 dark:text-surface-200">{r.name}</span>
                         <div className="flex gap-4 items-center">
                            <span className="font-medium text-surface-400">$${r.outputVwap.toFixed(2)}</span>
                            <span className={`font-bold tabular-nums ${r.marginDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {r.marginDelta > 0 ? '↑' : '↓'} {Math.abs(r.marginDelta).toFixed(1)}%
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="card p-6 flex flex-col justify-center space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                <div className="flex justify-between items-end border-b border-surface-100 dark:border-surface-800 pb-4">
                   <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">30D Forecast</span>
                   <span className="text-2xl font-bold text-brand-600">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">7D Projection</span>
                   <span className="text-xl font-bold text-emerald-600">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                </div>
             </div>
          </div>
       </div>

       <div className="md:col-span-4 space-y-6">
          <div className="card bg-brand-600 text-white p-6 !shadow-none border-none">
             <h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-80">Strategic Integration</h3>
             <div className="space-y-4">
                <CheckItem label="EXECUTIVE BOARD" active={core.effMan > 0} light />
                <CheckItem label="WAREHOUSE SYNC" active={core.inventoryValue > 0} light />
                <CheckItem label="DEBT MANAGEMENT" active={core.dailyInterest > 0} light />
                <CheckItem label="ECONOMY SYNC" active={true} light />
             </div>
          </div>
          <div className="card p-6 border-surface-200 dark:border-surface-800 !shadow-none bg-brand-50/10 dark:bg-brand-900/5">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                <h3 className="text-sm font-bold uppercase text-brand-600">Dynamic Intelligence Link</h3>
             </div>
             <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Company ID (e.g. 1664165)"
                  defaultValue={state.companyId}
                  className="flex-1 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                  id="companyIdInput"
                />
                <button
                  disabled={isSyncing}
                  onClick={() => {
                   const input = document.getElementById('companyIdInput') as HTMLInputElement;
                   onSync(input.value);
                }} className={`btn !bg-brand-600 text-white !py-2 !px-4 hover:shadow-lg hover:shadow-brand-500/20 transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                   {isSyncing ? '...' : 'CONNECT'}
                </button>
             </div>
             {state.companyName && (
                <button onClick={() => setState({ ...state, companyName: undefined, companyId: "", map: [] })} className="w-full text-[10px] font-bold text-rose-600 uppercase mb-4 text-left hover:underline">
                   Disconnect Secure Link
                </button>
             )}
             <p className="text-[10px] text-surface-500 font-medium leading-relaxed italic border-l-2 border-brand-200 dark:border-brand-800 pl-3">
                Authorizes direct retrieval of infrastructure architecture, efficiency coefficients, and fiscal liabilities from the central SimCompanies node.
             </p>
          </div>

          <div className="card p-6 border-surface-200 dark:border-surface-800 !shadow-none">
             <div className="flex items-center gap-3 mb-3">
                <Clock size={20} className="text-brand-600" />
                <h3 className="text-sm font-bold uppercase text-surface-500">Economic Cycle</h3>
             </div>
             <p className="text-base font-bold text-surface-800 dark:text-surface-200">
                {cycles?.current?.phase ? (
                   <>Current phase stability is <span className="text-brand-600">{(cycles.stability * 100).toFixed(0)}%</span>. Detected duration: <span className="text-brand-600">{cycles.current.duration} days</span>.</>
                ) : (
                   "Phase stability is high (84%). Expected transition in 2.4 days."
                )}
             </p>
          </div>
       </div>
    </div>
  );
}



