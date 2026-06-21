import { useState, useMemo } from "react";
import { Section, CardGrid } from "../components/Layout";

type StatementType = "income" | "cashflow" | "receipts" | "balance";

interface CSVData {
  id: string;
  name: string;
  date: string;
  type: StatementType;
  content: string;
}

export function CompanyToolsPage() {
  const [activeTab, setActiveTab] = useState<StatementType>("income");
  const [savedData, setSavedData] = useState<CSVData[]>(() => {
    const saved = localStorage.getItem("simco_company_data");
    return saved ? JSON.parse(saved) : [];
  });

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
            Upload and analyze your company's daily financial statements. All data is stored locally in your browser for privacy.
          </p>
        </div>
        <div className="flex gap-3">
           <button onClick={downloadCombinedCSV} className="btn btn-primary gap-2 shadow-lg shadow-brand-600/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download Combined Report
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {(["income", "cashflow", "receipts", "balance"] as const).map((tab) => (
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
            {tab === "income" ? "Income Statement" :
             tab === "cashflow" ? "Cash Flow" :
             tab === "receipts" ? "Cash Receipts/Disb." : "Balance Sheet"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 border-dashed border-2 border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
             <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white mb-1 uppercase tracking-tight">Upload Daily CSV</h3>
                <p className="text-xs text-surface-500 mb-6">Select a CSV export from SimCompanies</p>

                <label className="btn btn-primary w-full cursor-pointer">
                  Choose File
                  <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, activeTab)} className="hidden" />
                </label>
             </div>
          </div>

          <div className="card p-6 bg-surface-900 text-white border-none">
             <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-surface-400">Calculator Tools</h3>
             <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                   <div className="text-[10px] font-bold text-surface-500 uppercase mb-1">Production Optimization</div>
                   <p className="text-xs opacity-70 mb-3">Calculate saving potential across your current production chains.</p>
                   <button className="text-xs font-bold text-brand-400 uppercase tracking-widest hover:underline">Launch Tool &rarr;</button>
                </div>
                <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                   <div className="text-[10px] font-bold text-surface-500 uppercase mb-1">Price Analysis</div>
                   <p className="text-xs opacity-70 mb-3">Compare your internal production costs against current market VWAP.</p>
                   <button className="text-xs font-bold text-brand-400 uppercase tracking-widest hover:underline">Analyze Prices &rarr;</button>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className="card overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
                 <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">History: {activeTab.replace('-', ' ')}</h3>
                 <span className="text-[10px] font-bold text-surface-400">{filteredData.length} RECORDS</span>
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
                          <p className="text-[10px] font-mono text-surface-400 uppercase tracking-tighter">Uploaded {new Date(d.date).toLocaleString()}</p>
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
                  <div className="py-32 text-center text-surface-400 text-sm italic">
                    No records found for this category.<br />Upload a CSV file to get started.
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
