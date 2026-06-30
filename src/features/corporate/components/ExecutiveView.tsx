import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';
import {
  Users, Zap, DollarSign, Globe, Microscope,
  Calculator, ChevronRight, ClipboardPaste
} from 'lucide-react';

export function ExecutiveView({ state, setState, core }: any) {
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
  };

  const updateExec = (role: string, field: string, val: number) => {
     setState({
        ...state,
        board: {
           ...state.board,
           [role]: { ...state.board[role as keyof typeof state.board], [field]: val }
        }
     });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkillDisplay label="MANAGEMENT" value={core.effMan} icon={Zap} color="text-amber-500" sub="ADMIN_AO" />
        <SkillDisplay label="ACCOUNTING" value={core.effAcc} icon={DollarSign} color="text-emerald-500" sub="TAX_THOLD" />
        <SkillDisplay label="COMMUNICATION" value={core.effCom} icon={Globe} color="text-sky-500" sub="SALES_SPD" />
        <SkillDisplay label="SCIENCE" value={core.effSci} icon={Microscope} color="text-rose-500" sub="PATENT_ODDS" />
      </div>

      <div className="layout-grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExecRoleCard role="COO" data={state.board.coo} onUpdate={(f, v) => updateExec('coo', f, v)} />
              <ExecRoleCard role="COO_APP" data={state.board.cooApp} onUpdate={(f, v) => updateExec('cooApp', f, v)} isApp />
              <ExecRoleCard role="CFO" data={state.board.cfo} onUpdate={(f, v) => updateExec('cfo', f, v)} />
              <ExecRoleCard role="CFO_APP" data={state.board.cfoApp} onUpdate={(f, v) => updateExec('cfoApp', f, v)} isApp />
              <ExecRoleCard role="CMO" data={state.board.cmo} onUpdate={(f, v) => updateExec('cmo', f, v)} />
              <ExecRoleCard role="CMO_APP" data={state.board.cmoApp} onUpdate={(f, v) => updateExec('cmoApp', f, v)} isApp />
              <ExecRoleCard role="CTO" data={state.board.cto} onUpdate={(f, v) => updateExec('cto', f, v)} />
              <ExecRoleCard role="CTO_APP" data={state.board.ctoApp} onUpdate={(f, v) => updateExec('ctoApp', f, v)} isApp />
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card title="Quick Board Sync" icon={ClipboardPaste} className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-4 font-medium italic">
                 Paste executive text from the game to instantly sync skills.
              </p>
              <textarea
                 value={pasteData}
                 onChange={(e) => setPasteData(e.target.value)}
                 className="w-full h-32 p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none mb-3"
                 placeholder="COO\nManagement: 20..."
              />
              <Button variant="primary" className="w-full bg-amber-600 hover:bg-amber-700 shadow-amber-900/20" onClick={handlePaste}>
                 Sync All Skills
              </Button>
           </Card>

           <Card title="R&D Forecast" icon={Microscope}>
              <div className="space-y-4">
                 <SummaryLine label="Patent Prob" value={`${(core.patentProb*100).toFixed(1)}%`} />
                 <SummaryLine label="Research Speed" value={`+${(core.effSci * 2).toFixed(0)}%`} />
                 <SummaryLine label="Sales Speed" value={`+${(core.salesSpeedBonus * 100).toFixed(1)}%`} />

                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="txt-label mb-2">TARGET_QUALITY</p>
                    <Input
                       type="number"
                       value={state.settings.patentTargetQuality}
                       onChange={(e) => setState({...state, settings: {...state.settings, patentTargetQuality: Number(e.target.value)}})}
                    />
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function SkillDisplay({ label, value, icon: Icon, color, sub }: any) {
  return (
    <Card className="items-center text-center py-6 border-b-4 border-b-sky-600">
       <div className={cn("p-3 rounded-full mb-3", color.replace('text-', 'bg-') + '/10')}>
          <Icon size={24} className={color} />
       </div>
       <p className="txt-label">{label}</p>
       <p className="text-3xl font-black tabular-nums tracking-tighter mt-1">{value}</p>
       <Badge variant="neutral" className="mt-3 text-[9px]">{sub}</Badge>
    </Card>
  );
}

function ExecRoleCard({ role, data, onUpdate, isApp }: any) {
  return (
    <div className={cn(
       "p-5 rounded-2xl border transition-all duration-300",
       isApp
        ? "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
    )}>
       <div className="flex items-center justify-between mb-4">
          <span className={cn("text-xs font-black tracking-widest uppercase", !isApp && "text-sky-600")}>{role}</span>
          <div className="flex gap-1">
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <div className="w-1 h-1 rounded-full bg-slate-300" />
          </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <SkillInput label="MAN" value={data.management} onChange={(v) => onUpdate('management', v)} />
          <SkillInput label="ACC" value={data.accounting} onChange={(v) => onUpdate('accounting', v)} />
          <SkillInput label="COM" value={data.communication} onChange={(v) => onUpdate('communication', v)} />
          <SkillInput label="SCI" value={data.science} onChange={(v) => onUpdate('science', v)} />
       </div>
    </div>
  );
}

function SkillInput({ label, value, onChange }: any) {
  return (
    <div className="bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
       <p className="text-[10px] font-bold text-slate-500 mb-1">{label}</p>
       <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent font-black text-sm outline-none tabular-nums"
       />
    </div>
  );
}

function SummaryLine({ label, value }: any) {
   return (
      <div className="flex justify-between items-center py-1">
         <span className="text-xs font-bold text-slate-500">{label}</span>
         <span className="text-sm font-black">{value}</span>
      </div>
   );
}
