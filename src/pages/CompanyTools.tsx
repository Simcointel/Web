import React, { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState } from "../components/States";

type StatementType = "income" | "cashflow" | "receipts" | "balance" | "calculators";

interface CSVData {
  id: string;
  name: string;
  date: string;
  type: StatementType;
  content: string;
}

export function CompanyToolsPage() {
  const [activeTab, setActiveTab] = useState<StatementType>("income");
  const [realm, setRealm] = useState(0);
  const [savedData, setSavedData] = useState<CSVData[]>(() => {
    const saved = localStorage.getItem("simco_company_data");
    return saved ? JSON.parse(saved) : [];
  });

  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);

  useEffect(() => {
    localStorage.setItem("simco_company_data", JSON.stringify(savedData));
  }, [savedData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: StatementType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newData: CSVData = {
        id: crypto.randomUUID(),
        name: file.name,
        date: new Date().toISOString(),
        type,
        content
      };
      setSavedData(prev => [newData, ...prev]);
    };
    reader.readAsText(file);
  };

  const deleteData = (id: string) => {
    setSavedData(prev => prev.filter(d => d.id !== id));
  };

  const downloadCombinedCSV = () => {
    if (savedData.length === 0) return;
    const combined = savedData.map(d => `--- ${d.type.toUpperCase()}: ${d.name} (${d.date}) ---\n${d.content}\n`).join("\n");
    const blob = new Blob([combined], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_financials_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const filteredData = savedData.filter(d => d.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div>
          <h2 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Company Suite</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 max-w-xl leading-relaxed">
            Manage your company's financials and optimize production chains with real-time market data.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <select
              value={realm}
              onChange={(e) => setRealm(Number(e.target.value))}
              className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-brand-500 dark:text-white uppercase tracking-wider"
            >
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
            </select>
           <button onClick={downloadCombinedCSV} className="btn btn-primary gap-2 shadow-lg shadow-brand-600/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Archive
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {(["income", "cashflow", "receipts", "balance", "calculators"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap
              ${activeTab === tab
                ? "bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}
            `}
          >
            {tab === "income" ? "Income" :
             tab === "cashflow" ? "Cash Flow" :
             tab === "receipts" ? "Receipts" :
             tab === "balance" ? "Balance" : "Calculators"}
          </button>
        ))}
      </div>

      {activeTab === "calculators" ? (
        <CalculatorsView margins={margins?.resources ?? []} loading={mLoading} realm={realm} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="card p-8 border-dashed border-2 border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
              <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <h3 className="font-bold text-surface-900 dark:text-white mb-1 uppercase tracking-tight">Upload {activeTab}</h3>
                  <p className="text-xs text-surface-500 mb-6 uppercase font-bold tracking-tighter">Daily CSV from SimCompanies</p>

                  <label className="btn btn-primary w-full cursor-pointer">
                    Choose File
                    <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, activeTab)} className="hidden" />
                  </label>
              </div>
            </div>

            <div className="card p-6 bg-surface-900 text-white border-none">
              <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-surface-400">Analysis Summary</h3>
              <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                    <div className="text-[10px] font-bold text-surface-500 uppercase mb-1">Data Retention</div>
                    <p className="text-xs opacity-70">You have {savedData.length} total records stored locally.</p>
                  </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="card overflow-hidden h-full min-h-[500px]">
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
                  <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">{activeTab} History</h3>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">{filteredData.length} Records</span>
                </div>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredData.length > 0 ? filteredData.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p>
                            <p className="text-[10px] font-mono text-surface-400 uppercase tracking-tighter">{new Date(d.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="p-2 text-surface-400 hover:text-brand-600 transition-colors" title="View Data">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => deleteData(d.id)} className="p-2 text-surface-400 hover:text-econ-red transition-colors opacity-0 group-hover:opacity-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-40 text-center text-surface-400 text-sm italic">
                      No records found for this category.<br />Upload a CSV file to begin analysis.
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorsView({ margins, loading, realm }: { margins: any[]; loading: boolean; realm: number }) {
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [qty, setQty] = useState<number>(100);
  const [adminCost, setAdminCost] = useState<number>(10);
  const { data: deps } = useDataRepoPoll(() => dataRepo.fetchDependencies(realm), 120000, [realm]);

  const res = useMemo(() => margins.find(m => m.id === Number(selectedResource)), [margins, selectedResource]);

  const resourceDeps = useMemo(() => {
    if (!res || !deps?.bottleneckChains) return [];
    return deps.bottleneckChains.filter((c: any) => c.sectors.includes(res.categoryName));
  }, [res, deps]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-6 border-l-4 border-l-brand-600">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Production Config</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Target Resource</label>
                   <select
                      value={selectedResource}
                      onChange={(e) => setSelectedResource(e.target.value)}
                      className="input"
                   >
                      <option value="">-- select resource --</option>
                      {margins.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Quantity / Hour</label>
                   <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="input font-mono" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Admin Overhead (%)</label>
                   <input type="number" value={adminCost} onChange={(e) => setAdminCost(Number(e.target.value))} className="input font-mono" />
                </div>
             </div>
          </div>

          {res && (
            <div className="card p-6 bg-brand-600 text-white border-none shadow-xl shadow-brand-600/20 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
               </div>
               <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest opacity-80">Market Context</h3>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                     <span className="text-xs">Current VWAP</span>
                     <span className="font-mono font-bold text-lg">${res.outputVwap.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs">Benchmark Margin</span>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white/20`}>
                        {res.marginPct.toFixed(1)}%
                     </span>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${res.marginDirection === 'up' ? 'bg-econ-green' : 'bg-econ-red'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Trend: {res.trendDirection ?? 'Stable'}</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {resourceDeps.length > 0 && (
            <div className="card p-6 border-l-4 border-l-econ-amber bg-econ-amber/5">
               <h3 className="font-bold text-econ-amber text-[10px] uppercase tracking-widest mb-4">Supply Chain Alerts</h3>
               <div className="space-y-3">
                  {resourceDeps.map((d: any, i: number) => (
                    <div key={i} className="text-xs">
                       <p className="font-bold text-surface-900 dark:text-white mb-1">Pressure in {d.chain}</p>
                       <p className="text-surface-500 dark:text-surface-400">Current pressure index: <span className="font-mono font-bold">{d.pressure.toFixed(2)}</span></p>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       <div className="lg:col-span-8">
          {res ? (
             <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
                   <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest tracking-tight">Projection: {res.name}</h3>
                   <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded text-[10px] font-bold uppercase">Dynamic Analysis</span>
                </div>
                <div className="p-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                         <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Hourly Revenue</p>
                         <div className="text-3xl font-black text-surface-900 dark:text-white font-mono tracking-tighter">${(res.outputVwap * qty).toFixed(2)}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                         <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Operating Costs</p>
                         <div className="text-3xl font-black text-econ-red font-mono tracking-tighter">${((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour) * (1 + adminCost/100)).toFixed(2)}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50">
                         <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase mb-1">Net Profit / HR</p>
                         <div className="text-3xl font-black text-econ-green font-mono tracking-tighter">${((res.outputVwap * qty) - ((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour) * (1 + adminCost/100))).toFixed(2)}</div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-4">Cost Structure Breakdown</h4>
                         <div className="w-full h-10 flex rounded-xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-inner p-1 bg-white dark:bg-surface-900">
                            <div className="bg-brand-500 h-full rounded-l-lg" style={{ width: '60%' }} title="Inputs"></div>
                            <div className="bg-econ-purple h-full mx-0.5" style={{ width: '25%' }} title="Wages"></div>
                            <div className="bg-econ-amber h-full" style={{ width: '10%' }} title="Transport"></div>
                            <div className="bg-surface-300 dark:bg-surface-700 h-full rounded-r-lg ml-0.5" style={{ width: '5%' }} title="Admin"></div>
                         </div>
                      </div>

                      <CardGrid cols={2}>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-brand-500"></div>
                                  <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400 uppercase">Input Materials</span>
                               </div>
                               <span className="font-mono text-xs font-bold">${(res.inputCostPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-econ-purple"></div>
                                  <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400 uppercase">Labor Costs</span>
                               </div>
                               <span className="font-mono text-xs font-bold">${(res.wagesPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-econ-amber"></div>
                                  <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400 uppercase">Logistics (Transport)</span>
                               </div>
                               <span className="font-mono text-xs font-bold">${(res.transportPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm bg-surface-300 dark:bg-surface-700"></div>
                                  <span className="text-[10px] font-bold text-surface-600 dark:text-surface-400 uppercase">Admin Overhead</span>
                               </div>
                               <span className="font-mono text-xs font-bold">${(((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour)) * (adminCost/100)).toFixed(2)}</span>
                            </div>
                         </div>
                      </CardGrid>
                   </div>
                </div>
                <div className="px-8 py-6 bg-surface-50 dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 flex flex-col md:flex-row justify-between items-center gap-4">
                   <p className="text-[10px] text-surface-400 font-medium max-w-md text-center md:text-left leading-relaxed">
                      This simulation uses real-time market indices for {res.name}.
                      Net profit is an estimate based on standard production cycles and does not include executive bonuses or research speed impacts.
                   </p>
                   <button className="btn btn-primary text-[10px] font-bold uppercase tracking-widest py-2 px-6">Export Production Plan</button>
                </div>
             </div>
          ) : (
             <div className="card h-full min-h-[400px] flex flex-col items-center justify-center p-20 text-center border-dashed border-2 border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-950/30">
                <div className="w-20 h-20 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-300 mb-6 shadow-inner">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-surface-900 dark:text-white mb-2 uppercase tracking-tight">Production Engine Idle</h3>
                <p className="text-sm text-surface-500 max-w-xs leading-relaxed">Select a target resource from the configuration panel to run a profitability simulation.</p>
             </div>
          )}
       </div>
    </div>
  );
}
