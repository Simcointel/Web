import React, { useState } from "react";
import {
  Zap, DollarSign, Globe, Microscope, Calculator
} from "lucide-react";
import { SkillNode, ExecCard, ForecastLine } from "./components";

import type { SuiteViewProps } from "./types";

export function ExecutiveView({ state, setState, core, setNotification }: SuiteViewProps) {
  const [pasteData, setPasteData] = useState("");
  const handlePaste = () => {
    const lines = pasteData.split('\n');
    const newBoard = { ...state.board };
    let cur: keyof typeof state.board | null = null;
    lines.forEach(l => {
      const t = l.trim();
      if (['COO', 'CFO', 'CMO', 'CTO'].includes(t)) cur = t.toLowerCase() as keyof typeof state.board;
      else if (t.includes('Management:')) { if (cur) newBoard[cur].management = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Accounting:')) { if (cur) newBoard[cur].accounting = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Communication:')) { if (cur) newBoard[cur].communication = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Science:')) { if (cur) newBoard[cur].science = parseInt(t.split(':')[1]) || 0; }
    });
    setState({ ...state, board: newBoard });
    setPasteData("");
    setNotification?.({ msg: "Board Integrated Successfully", type: "success" });
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <SkillNode label="Management" value={core.effMan} icon={Zap} sub="AO Reduction" color="text-amber-600" />
          <SkillNode label="Accounting" value={core.effAcc} icon={DollarSign} sub="Tax Threshold" color="text-emerald-600" />
          <SkillNode label="Communication" value={core.effCom} icon={Globe} sub="Sales Speed" color="text-indigo-600" />
          <SkillNode label="Science" value={core.effSci} icon={Microscope} sub="Patent Odds" color="text-rose-600" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExecCard role="Chief Operating Officer" data={state.board.coo} onChange={d => setState({...state, board: {...state.board, coo: d}})} />
                <ExecCard role="COO Apprentice" data={state.board.cooApp} onChange={d => setState({...state, board: {...state.board, cooApp: d}})} isApp />
                <ExecCard role="Chief Financial Officer" data={state.board.cfo} onChange={d => setState({...state, board: {...state.board, cfo: d}})} />
                <ExecCard role="CFO Apprentice" data={state.board.cfoApp} onChange={d => setState({...state, board: {...state.board, cfoApp: d}})} isApp />
                <ExecCard role="Chief Marketing Officer" data={state.board.cmo} onChange={d => setState({...state, board: {...state.board, cmo: d}})} />
                <ExecCard role="CMO Apprentice" data={state.board.cmoApp} onChange={d => setState({...state, board: {...state.board, cmoApp: d}})} isApp />
                <ExecCard role="Chief Technical Officer" data={state.board.cto} onChange={d => setState({...state, board: {...state.board, cto: d}})} />
                <ExecCard role="CTO Apprentice" data={state.board.ctoApp} onChange={d => setState({...state, board: {...state.board, ctoApp: d}})} isApp />
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="card p-6 border-surface-200 dark:border-surface-800 !shadow-none">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4">Board Intelligence Sync</h3>
                <p className="text-xs text-surface-500 mb-4 font-medium leading-relaxed">Paste the raw text from your Executives page to instantly update skills.</p>
                <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} className="w-full h-32 p-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none mb-4" placeholder="COO Management: 20..." />
                <button onClick={handlePaste} className="w-full btn !bg-amber-600 text-white !py-3 font-bold uppercase text-sm">Apply Sync</button>
             </div>

             <div className="card p-6 space-y-6 border-surface-200 dark:border-surface-800 !shadow-none">
                <div className="flex items-center gap-2">
                   <Calculator size={18} className="text-amber-600" />
                   <h3 className="text-sm font-bold uppercase text-surface-500">R&D Impact Analysis</h3>
                </div>
                <div className="space-y-4 text-sm">
                   <ForecastLine label="Patent Probability" value={`${(core.patentProb*100).toFixed(1)}%`} />
                   <ForecastLine label="Research Speed" value={`${(core.effSci * 2).toFixed(0)}%`} />
                   <ForecastLine label="Retail Sales Bonus" value={`+${(core.salesSpeedBonus * 100).toFixed(1)}%`} />
                   <div className="flex justify-between items-center pt-2 border-t border-surface-50 dark:border-surface-800">
                      <span className="font-bold text-surface-500 uppercase text-xs">Target Quality</span>
                      <input type="number" value={state.settings?.patentTargetQuality} onChange={(e) => setState({...state, settings: {...state.settings, patentTargetQuality: Number(e.target.value)}})} className="w-12 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-right font-bold py-1 px-2 rounded-md outline-none focus:ring-1 focus:ring-amber-500" />
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
