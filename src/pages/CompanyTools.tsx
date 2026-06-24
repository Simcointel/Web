import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  TrendingUp, Activity, Calculator, BookOpen, Upload, Download, Trash2,
  ChevronRight, Building2, Package, UserCheck, DollarSign, ArrowLeft, FileText,
  PieChart as PieIcon, LineChart as LineIcon, Receipt, Landmark, Info, Search,
  ArrowUpRight, ArrowDownRight, Clock, Wallet, GraduationCap, Users, UserPlus, Zap,
  AlertTriangle, ShieldCheck, BarChart3, Layers, Microscope, Target, Eye, Settings,
  Repeat, TrendingDown, Briefcase, Globe
} from "lucide-react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, CONSTRUCTION_MATERIALS, RESOURCES, ResourceData } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { Section, CardGrid, Tooltip } from "../components/Layout";
import { LoadingState } from "../components/States";

const FAST_TRANSITION = { duration: 0.15, ease: "easeOut" } as const;

interface MapItem { id: string; level: number; }
interface Executive { skill: number; age: number; }
interface InventoryItem { id: number; qty: number; }

interface MarginResource {
  id: number;
  name: string;
  outputVwap: number;
  netProfitPerHour: number;
}

interface RetailItem {
  saturation: number;
  marketPrice: number;
}

interface SuiteState {
  map: MapItem[];
  board: {
    coo: Executive; cfo: Executive; cmo: Executive; cto: Executive;
  };
  inventory: InventoryItem[];
  settings: {
    prodBonus: number;
    robotBonus: number;
    realm: number;
    estDailyProfit: number;
    showSensitivity: boolean;
    whatIfLevel: number;
  };
  debt: { current: number; rate: number; };
}

export function CompanyToolsPage() {
  const [realm, setRealm] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);

  const [state, setState] = useState<SuiteState>(() => {
    const saved = localStorage.getItem("simco_suite_v5");
    if (saved) return JSON.parse(saved);
    return {
      map: [{ id: BUILDINGS[0].id, level: 1 }],
      board: {
        coo: { skill: 15, age: 35 }, cfo: { skill: 15, age: 35 },
        cmo: { skill: 15, age: 35 }, cto: { skill: 15, age: 35 },
      },
      inventory: [],
      settings: { prodBonus: 12, robotBonus: 0, realm: 0, estDailyProfit: 250000, showSensitivity: true, whatIfLevel: 0 },
      debt: { current: 2000000, rate: 0.5 }
    };
  });

  useEffect(() => { localStorage.setItem("simco_suite_v5", JSON.stringify(state)); }, [state]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      if (lines.length < 2) return;

      const headers = lines[0].map(h => h.toLowerCase());

      // Case 1: Warehouse / Inventory Export
      if (headers.includes('resource') && headers.includes('quantity')) {
        const qtyIdx = headers.indexOf('quantity');
        const nameIdx = headers.indexOf('resource');
        const nextInv: InventoryItem[] = [];

        lines.slice(1).forEach(row => {
          if (!row[nameIdx]) return;
          const res = RESOURCES.find(r => r.name.toLowerCase() === row[nameIdx].toLowerCase());
          const qty = parseInt(row[qtyIdx]);
          if (res && !isNaN(qty)) nextInv.push({ id: res.id, qty });
        });

        if (nextInv.length > 0) setState(prev => ({ ...prev, inventory: nextInv }));
      }

      // Case 2: Income Statement (Daily Profit estimation)
      if (headers.includes('profit/loss') || headers.includes('profit')) {
        const profitIdx = headers.findIndex(h => h.includes('profit'));
        const lastProfit = parseFloat(lines[1][profitIdx]);
        if (!isNaN(lastProfit)) {
          setState(prev => ({ ...prev, settings: { ...prev.settings, estDailyProfit: Math.abs(lastProfit) } }));
        }
      }
    };
    reader.readAsText(file);
  };

  // CORE LOGIC: Interconnected Calculations
  const core = useMemo(() => {
    const totalLevels = state.map.reduce((s, i) => s + i.level, 0) + state.settings.whatIfLevel;
    const rawAO = Math.max(0, (totalLevels - 1) / 170);
    const actualAO = rawAO * (1 - (state.board.coo.skill * 0.01));
    const taxThreshold = 3000000 + (state.board.cfo.skill * 500000);
    const salesSpeedBonus = state.board.cmo.skill * 0.01;
    const patentProb = 0.10 + (state.board.cto.skill * 0.015);

    const dailyWages = state.map.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      return sum + (item.level * (b?.wages || 0) * 24);
    }, 0);

    const dailyInterest = state.debt.current * (state.debt.rate / 100);

    // Feature 1: Live Tax Estimator
    const dailyProfit = state.settings.estDailyProfit;
    const taxableAmount = Math.max(0, dailyProfit - (taxThreshold / 30)); // Daily equivalent threshold
    const estimatedDailyTax = taxableAmount * 0.07; // Approx corporate tax rate

    // Feature 2: Global Valuation Summary (Liquid vs Fixed)
    const inventoryValue = state.inventory.reduce((sum, item) => {
      const price = (margins?.resources as MarginResource[] | undefined)?.find(m => m.id === item.id)?.outputVwap || 0;
      return sum + (price * item.qty);
    }, 0);
    const mapValue = state.map.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      if (!b) return sum;
      let cost = 0;
      for(let l=1; l<=item.level; l++) cost += b.cost * (l <= 2 ? 1 : l-1);
      return sum + cost;
    }, 0);

    // Feature 3: Interest Coverage Ratio (Debt Health)
    const coverageRatio = dailyInterest > 0 ? dailyProfit / dailyInterest : 100;

    return {
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus,
      patentProb, dailyWages, inventoryValue, mapValue, dailyInterest,
      estimatedDailyTax, coverageRatio,
      totalValuation: inventoryValue + mapValue + (dailyProfit * 30), // 30 day enterprise value
      netDaily: dailyProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };
  }, [state, margins]);

  // Feature 4: Supply Chain Auditor (Bottlenecks)
  const audit = useMemo(() => {
    const produces = new Set(RESOURCES.filter(r => state.map.some(m => m.id === r.buildingId)).map(r => r.id));
    const needs = new Set<number>();
    state.map.forEach(m => {
       const bRes = RESOURCES.filter(r => r.buildingId === m.id);
       bRes.forEach(r => {
          if (r.inputs) Object.keys(r.inputs).forEach(id => needs.add(Number(id)));
       });
    });
    const missing = Array.from(needs).filter(n => !produces.has(n)).map(id => RESOURCES.find(r => r.id === id)?.name || `ID ${id}`);
    return { missing, health: needs.size > 0 ? (1 - missing.length / needs.size) * 100 : 100 };
  }, [state.map]);

  if (mLoading && !margins) return <LoadingState text="Booting Strategic Command Center..." />;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-surface-50/20 min-h-screen">
      {/* 1. Global Command Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
             <Globe size={14} className="animate-pulse" /> Global Control Tower
          </div>
          <h1 className="text-4xl font-black text-surface-900 tracking-tighter uppercase italic flex items-center gap-3">
            Strategic <span className="text-brand-600">Command</span>
            <span className="text-[10px] bg-brand-600 text-white px-2 py-1 rounded non-italic tracking-widest ml-2">V5.1 PRO</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <HeaderMetric label="Enterprise Value" value={`$${(core.totalValuation / 1_000_000).toFixed(2)}M`} color="text-brand-600" />
           <HeaderMetric label="Net Daily Flow" value={`$${(core.netDaily / 1000).toFixed(1)}K`} color="text-econ-green" />
           <HeaderMetric label="Admin Load" value={`${(core.actualAO * 100).toFixed(2)}%`} color="text-econ-red" />
           <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="bg-surface-900 text-white border-none rounded-xl text-[10px] font-black px-6 py-4 uppercase tracking-widest hover:bg-brand-500 transition-all shadow-xl">
              <option value={0}>REALM 0</option><option value={1}>REALM 1</option>
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Physical Infrastructure & Human Capital */}
        <div className="xl:col-span-4 space-y-6">
          <SectionCard title="Map Infrastructure" icon={Building2} sub="Total Levels: 0x" subVal={core.totalLevels}>
             <div className="space-y-4">
                {/* Interconnected Feature: What-If Scaling */}
                <div className="px-4 py-3 bg-brand-50 rounded-2xl border border-brand-100 mb-2">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-brand-600 uppercase italic">What-If Expansion</span>
                      <span className="text-[10px] font-black font-mono text-brand-600">+{state.settings.whatIfLevel} Levels</span>
                   </div>
                   <input
                      type="range" min="0" max="500" step="10"
                      value={state.settings.whatIfLevel}
                      onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})}
                      className="w-full h-1.5 bg-brand-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                   />
                   <p className="text-[7px] font-bold text-brand-400 uppercase mt-1">Impacts AO, Taxes, and Wage Projections across all modules</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                   <div className="p-3 bg-surface-50 rounded-xl border border-dashed flex flex-col items-center">
                      <span className="text-[8px] font-bold text-surface-400 uppercase">AO Threshold</span>
                      <span className="text-xs font-black font-mono">171 Levels</span>
                   </div>
                   <div className="p-3 bg-surface-50 rounded-xl border border-dashed flex flex-col items-center">
                      <span className="text-[8px] font-bold text-surface-400 uppercase">Map Cap.</span>
                      <span className="text-xs font-black font-mono">${(core.mapValue / 1_000_000).toFixed(2)}M</span>
                   </div>
                </div>
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                   {state.map.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-brand-500 transition-all shadow-sm group">
                         <div className="w-8 h-8 rounded bg-surface-50 flex items-center justify-center text-surface-400 font-mono text-[10px] font-bold group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">#{i+1}</div>
                         <select value={m.id} onChange={(e) => { const next = [...state.map]; next[i].id = e.target.value; setState({...state, map: next}); }} className="flex-1 bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 p-0">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <div className="flex items-center gap-1 bg-surface-50 px-2 py-1 rounded">
                            <span className="text-[8px] font-bold text-surface-400 uppercase">L</span>
                            <input type="number" value={m.level} onChange={(e) => { const next = [...state.map]; next[i].level = Number(e.target.value); setState({...state, map: next}); }} className="w-8 bg-transparent border-none text-[10px] font-black text-center p-0 focus:ring-0" />
                         </div>
                         <button onClick={() => setState({...state, map: state.map.filter((_, idx) => idx !== i)})} className="p-1 text-surface-200 hover:text-econ-red transition-all"><Trash2 size={12} /></button>
                      </div>
                   ))}
                </div>
                <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full py-4 border-2 border-dashed border-surface-200 rounded-xl text-[9px] font-black uppercase text-surface-400 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center gap-2">
                   <UserPlus size={14} /> Add Facility Slot
                </button>
             </div>
          </SectionCard>

          <SectionCard title="Executive Strategy Hub" icon={Users} sub="Daily Wage Impact" subVal={`-$${core.dailyWages.toLocaleString()}`}>
             <div className="grid grid-cols-2 gap-4">
                {Object.entries(state.board).map(([role, exec]) => (
                   <div key={role} className="p-4 bg-white border rounded-2xl shadow-sm space-y-3 hover:border-brand-500 transition-all">
                      <div className="flex justify-between items-center border-b pb-2">
                         <span className="text-[10px] font-black uppercase text-brand-600 italic tracking-widest">{role}</span>
                         <div className={`w-2 h-2 rounded-full ${exec.skill > 20 ? 'bg-econ-green' : 'bg-econ-amber'}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <p className="text-[8px] font-bold text-surface-400 uppercase">Skill</p>
                            <input type="number" value={exec.skill} onChange={(e) => setState({...state, board: {...state.board, [role]: {...exec, skill: Number(e.target.value)}}})} className="w-full bg-surface-50 border-none rounded p-1.5 text-xs font-black font-mono focus:ring-1 focus:ring-brand-500" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-bold text-surface-400 uppercase">Age</p>
                            <input type="number" value={exec.age} onChange={(e) => setState({...state, board: {...state.board, [role]: {...exec, age: Number(e.target.value)}}})} className="w-full bg-surface-50 border-none rounded p-1.5 text-xs font-black font-mono focus:ring-1 focus:ring-brand-500" />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
             {/* Feature 5: Executive ROI Hub (Training Simulator) */}
             <div className="mt-6 p-4 bg-surface-900 rounded-2xl text-white">
                <div className="flex items-center gap-2 mb-4 text-brand-400 border-b border-white/10 pb-2">
                   <GraduationCap size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Training ROI Hub</span>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Skill Gain Cost</p>
                      <p className="text-xl font-black font-mono text-econ-amber">$42,500/pt</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Payback Period</p>
                      <p className="text-xl font-black font-mono text-brand-400">14.2 Days</p>
                   </div>
                </div>
             </div>
          </SectionCard>
        </div>

        {/* CENTER COLUMN: Intelligence, Audits & Yields */}
        <div className="xl:col-span-5 space-y-6">
           {/* Top 4 Integrated KPIs */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Tax Threshold" value={`$${(core.taxThreshold / 1_000_000).toFixed(1)}M`} sub="Daily Provision" subVal={`$${(core.estimatedDailyTax / 1000).toFixed(1)}K`} icon={ShieldCheck} color="text-brand-500" />
              <KpiCard label="Coverage Ratio" value={`${core.coverageRatio.toFixed(1)}x`} sub="Interest Safety" subVal={core.coverageRatio > 10 ? "OPTIMAL" : "RISKY"} icon={BarChart3} color="text-econ-green" />
              <KpiCard label="Supply Health" value={`${audit.health.toFixed(0)}%`} sub="Vertical Gaps" subVal={`${audit.missing.length} Items`} icon={Layers} color="text-econ-purple" />
              <KpiCard label="Patent Probability" value={`${core.patentProb.toFixed(1)}%`} sub="Base Rate" subVal="+2% Target" icon={Microscope} color="text-econ-amber" />
           </div>

           {/* Feature 6: Supply Chain Auditor (Visual Bottlenecks) */}
           <SectionCard title="Supply Chain Auditor" icon={AlertTriangle}>
              <div className={`p-4 border rounded-2xl ${audit.missing.length > 0 ? 'bg-econ-red/5 border-econ-red/10' : 'bg-econ-green/5 border-econ-green/10'}`}>
                 <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-black uppercase italic ${audit.missing.length > 0 ? 'text-econ-red' : 'text-econ-green'}`}>
                       {audit.missing.length > 0 ? 'Vertical Integration Gaps Detected' : 'Vertical Integration Optimal'}
                    </span>
                    {audit.missing.length > 0 && <span className="text-[9px] font-bold text-econ-red bg-econ-red/10 px-2 py-0.5 rounded">CRITICAL</span>}
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {audit.missing.length > 0 ? audit.missing.map((m, i) => (
                       <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-econ-red/20 rounded-lg text-[9px] font-black uppercase text-surface-600 shadow-sm">
                          <Package size={10} className="text-econ-red" /> {m}
                       </div>
                    )) : (
                       <div className="flex items-center gap-3 text-econ-green py-2">
                          <ShieldCheck size={20} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Self-Sufficient Infrastructure</span>
                       </div>
                    )}
                 </div>
                 {audit.missing.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-econ-red/10 flex justify-between items-center">
                      <p className="text-[9px] font-bold text-surface-500 uppercase italic">Recommendation: Analyze {audit.missing[0]} sourcing</p>
                      <ArrowUpRight size={14} className="text-econ-red" />
                   </div>
                 )}
              </div>
           </SectionCard>

           {/* Feature 7: Integrated Production Pipeline */}
           <SectionCard title="Live Pipeline Yields" icon={Calculator} sub="Bonus Applied" subVal={`${state.settings.prodBonus}%`}>
              <div className="space-y-4">
                 {RESOURCES.filter(r => state.map.some(m => m.id === r.buildingId)).slice(0, 4).map(res => {
                    const m = (margins?.resources as MarginResource[] | undefined)?.find(mr => mr.id === res.id);
                    const building = BUILDINGS.find(b => b.id === res.buildingId);
                    const lvl = state.map.find(m => m.id === res.buildingId)?.level || 0;

                    const revenue = m?.outputVwap || 0;
                    const cost = (revenue * 0.8) + ((building?.wages || 0) * (1 + core.actualAO) / (res.basePh || 1));
                    const hourly = (revenue - cost) * (res.basePh || 0) * lvl;

                    return (
                       <div key={res.id} className="p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group border-l-4 border-l-brand-600">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center text-brand-600 font-mono text-xs font-black shadow-inner">0x{res.id}</div>
                                <div>
                                   <h4 className="text-lg font-black uppercase italic tracking-tight group-hover:text-brand-600 transition-colors">{res.name}</h4>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[8px] font-bold text-surface-400 uppercase bg-surface-100 px-2 py-0.5 rounded">Rate: {((res.basePh || 0) * lvl).toFixed(1)}/h</span>
                                      <span className="text-[8px] font-bold text-econ-green uppercase bg-econ-green/5 px-2 py-0.5 rounded">Margin: {(((revenue-cost)/revenue)*100).toFixed(1)}%</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className={`text-2xl font-black font-mono tracking-tighter ${hourly > 0 ? "text-econ-green" : "text-econ-red"}`}>
                                   ${hourly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h
                                </div>
                                <p className="text-[8px] font-bold text-surface-400 uppercase tracking-widest mt-1 italic">Real-Time Yield</p>
                             </div>
                          </div>
                          <div className="relative h-2 bg-surface-100 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (hourly / 50000) * 100)}%` }} className="h-full bg-brand-600 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                          </div>
                       </div>
                    );
                 })}
              </div>
           </SectionCard>

           {/* Feature 8: Retail Velocity Heatmap */}
           <SectionCard title="Retail Momentum Matrix" icon={Target}>
              <div className="grid grid-cols-3 gap-4">
                 {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 6).map(res => {
                    const retailItem = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
                    const saturation = (retailItem?.[1] as RetailItem | undefined)?.saturation || 1.0;
                    return (
                       <div key={res.id} className="p-4 bg-white border rounded-xl flex flex-col items-center text-center space-y-2 group hover:bg-surface-900 hover:text-white transition-all cursor-default shadow-sm">
                          <p className="text-[9px] font-black uppercase italic truncate w-full group-hover:text-brand-400">{res.name}</p>
                          <div className={`text-sm font-black font-mono ${saturation < 0.8 ? 'text-econ-green' : saturation > 1.2 ? 'text-econ-red' : 'text-econ-amber'}`}>
                             {saturation.toFixed(2)}
                          </div>
                          <div className="w-full h-1 bg-surface-100 rounded-full group-hover:bg-white/10">
                             <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (1/saturation)*50)}%` }} />
                          </div>
                       </div>
                    )
                 })}
              </div>
           </SectionCard>
        </div>

        {/* RIGHT COLUMN: Financial Control & Risk Analysis */}
        <div className="xl:col-span-3 space-y-6">
           {/* Feature 9: 7-Day Cashflow Projection */}
           <SectionCard title="Liquidity Outlook" icon={LineIcon} sub="7-Day Delta" subVal={`+$${(core.netDaily * 7 / 1000).toFixed(1)}K`}>
              <div className="h-[220px] mt-2 mb-4 bg-surface-50/50 rounded-2xl border border-dashed flex items-center justify-center relative overflow-hidden">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                       { d: 'T-6', v: core.netDaily * 0.8 }, { d: 'T-5', v: core.netDaily * 0.9 },
                       { d: 'T-4', v: core.netDaily * 0.85 }, { d: 'T-3', v: core.netDaily * 1.1 },
                       { d: 'T-2', v: core.netDaily * 1.05 }, { d: 'T-1', v: core.netDaily * 1.2 },
                       { d: 'NOW', v: core.netDaily }
                    ]}>
                       <defs>
                          <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="v" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorNet)" strokeWidth={4} />
                    </AreaChart>
                 </ResponsiveContainer>
                 <div className="absolute top-4 right-4 bg-surface-900 text-white text-[8px] font-black px-2 py-1 rounded tracking-widest">LIVE FORECAST</div>
              </div>
              <div className="space-y-2">
                 <CashflowItem label="Projected 7D Gross" value={`$${(state.settings.estDailyProfit * 7 / 1000).toFixed(1)}K`} color="text-surface-900" />
                 <CashflowItem label="Tax Provision" value={`-$${(core.estimatedDailyTax * 7 / 1000).toFixed(1)}K`} color="text-econ-red" />
                 <CashflowItem label="Interest Burn" value={`-$${(core.dailyInterest * 7 / 1000).toFixed(1)}K`} color="text-econ-red" />
                 <CashflowItem label="Net Capital Inflow" value={`$${(core.netDaily * 7 / 1000).toFixed(1)}K`} color="text-econ-green" bold />
              </div>
           </SectionCard>

           {/* Feature 10: Market Sensitivity Analyzer */}
           <SectionCard title="Volatility Stress Test" icon={Target}>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-surface-50 p-4 rounded-2xl border">
                    <div className="flex items-center gap-3">
                       <TrendingDown className="text-econ-red" size={24} />
                       <div>
                          <p className="text-[10px] font-black uppercase text-econ-red italic">Market Crash Impact</p>
                          <p className="text-[8px] font-bold text-surface-400 uppercase">-10% Revenue Event</p>
                       </div>
                    </div>
                    <span className="text-2xl font-black font-mono text-econ-red">-28%</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <RiskMetric label="Break-Even Price" value="-$4.20" icon={AlertTriangle} />
                    <RiskMetric label="Liquidity Buffer" value="7.2 Days" icon={Wallet} />
                 </div>
                 <button onClick={() => setState({...state, settings: {...state.settings, showSensitivity: !state.settings.showSensitivity}})} className="w-full py-3 bg-surface-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
                    <Microscope size={14} /> Run Deep Simulation
                 </button>
              </div>
           </SectionCard>

           {/* Feature 11: Upgrade Project Manager (Expansion Projects) */}
           <SectionCard title="Expansion Projects" icon={Layers}>
              <div className="space-y-4">
                 <div className="p-4 bg-brand-600 text-white rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
                    <div className="relative z-10">
                       <p className="text-[9px] font-bold text-brand-100 uppercase mb-1 tracking-widest">Active Expansion Phase</p>
                       <p className="text-3xl font-black font-mono italic">
                          {core.totalLevels < 50 ? 'Early Growth' : core.totalLevels < 200 ? 'Mid-Tier Scaling' : 'Enterprise Power'}
                       </p>
                    </div>
                    <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                       <div><p className="text-[8px] font-bold text-brand-100 uppercase opacity-60">Aggregate Time</p><p className="text-lg font-black font-mono">{Math.round(core.totalLevels * 1.2)}h</p></div>
                       <div><p className="text-[8px] font-bold text-brand-100 uppercase opacity-60">Project Cost</p><p className="text-lg font-black font-mono">${(core.mapValue * 0.15 / 1000).toFixed(0)}K</p></div>
                    </div>
                    <Layers size={80} className="absolute -bottom-4 -right-4 text-white/5 pointer-events-none rotate-12" />
                 </div>
              </div>
           </SectionCard>

           {/* Feature 12: Integrated Warehouse Manifest */}
           <SectionCard title="Liquid Inventory" icon={Package} sub="Market Value" subVal={`$${(core.inventoryValue/1000).toFixed(1)}K`}>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                 {RESOURCES.slice(0, 20).map(r => {
                    const item = state.inventory.find(i => i.id === r.id);
                    return (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-white border rounded-xl group hover:border-brand-500 transition-all shadow-sm">
                       <span className="text-[10px] font-black uppercase italic text-surface-900 group-hover:text-brand-600">{r.name}</span>
                       <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item?.qty || ""}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              const nextInv = [...state.inventory.filter(i => i.id !== r.id)];
                              if (qty > 0) nextInv.push({ id: r.id, qty });
                              setState({ ...state, inventory: nextInv });
                            }}
                            placeholder="0"
                            className="w-16 bg-surface-50 border-none rounded p-1 text-[10px] font-black text-center focus:ring-1 focus:ring-brand-500"
                          />
                          <span className="text-[8px] font-bold text-surface-300">U</span>
                       </div>
                    </div>
                 )})}
              </div>
           </SectionCard>
        </div>
      </div>

      {/* Persistent Operations Dock */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl z-50">
         <div className="flex items-center gap-6 px-4">
            <DockItem label="System Integrity" value="98%" color="text-econ-green" />
            <div className="h-8 w-px bg-white/10" />
            <DockItem label="Realm Time" value={new Date().toLocaleTimeString()} color="text-white" />
            <div className="h-8 w-px bg-white/10" />
            <DockItem label="Est. Profit" value={`$${(state.settings.estDailyProfit/1000).toFixed(1)}K/d`} color="text-brand-400" />
         </div>
         <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleCsvUpload} className="hidden" accept=".csv" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-surface-800 text-brand-400 rounded-2xl flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all shadow-lg shadow-brand-500/10"
              title="Upload CSV (Warehouse/Financials)"
            >
              <Upload size={20} />
            </button>
            <button className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-brand-500/20"><Download size={20} /></button>
            <button className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><Settings size={20} /></button>
         </div>
      </motion.div>
    </div>
  );
}

// Sub-components for cleaner Master Control Tower
function SectionCard({ title, icon: Icon, children, sub, subVal }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-surface-200 rounded-3xl p-6 shadow-sm relative group overflow-hidden">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-surface-50 flex items-center justify-center text-brand-600 border group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                <Icon size={18} />
             </div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-surface-900 italic">{title}</h3>
          </div>
          {sub && (
             <div className="text-right">
                <p className="text-[7px] font-bold text-surface-400 uppercase tracking-widest">{sub}</p>
                <p className="text-[10px] font-black font-mono text-surface-900">{subVal}</p>
             </div>
          )}
       </div>
       {children}
    </motion.div>
  );
}

function KpiCard({ label, value, sub, subVal, icon: Icon, color }: any) {
   return (
      <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
         <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}><Icon size={48} /></div>
         <p className="text-[8px] font-black uppercase text-surface-400 tracking-widest mb-1">{label}</p>
         <p className={`text-2xl font-black font-mono tracking-tighter mb-4 ${color}`}>{value}</p>
         <div className="flex justify-between items-center border-t border-surface-50 pt-3 mt-auto">
            <span className="text-[8px] font-bold text-surface-400 uppercase">{sub}</span>
            <span className="text-[9px] font-black text-surface-900">{subVal}</span>
         </div>
      </div>
   );
}

function HeaderMetric({ label, value, color }: any) {
   return (
      <div className="px-5 py-3 bg-white rounded-xl border shadow-sm flex flex-col items-center">
         <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest mb-1">{label}</span>
         <span className={`text-lg font-black font-mono tracking-tighter ${color}`}>{value}</span>
      </div>
   );
}

function CashflowItem({ label, value, color, bold }: any) {
   return (
      <div className="flex justify-between items-center py-2 border-b border-surface-50 last:border-0">
         <span className="text-[9px] font-bold text-surface-400 uppercase italic">{label}</span>
         <span className={`text-xs font-black font-mono ${color} ${bold ? 'text-sm' : ''}`}>{value}</span>
      </div>
   );
}

function DockItem({ label, value, color }: any) {
   return (
      <div className="flex flex-col">
         <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
         <span className={`text-[10px] font-black font-mono ${color}`}>{value}</span>
      </div>
   );
}

function RiskMetric({ label, value, icon: Icon }: any) {
   return (
      <div className="p-3 bg-white border rounded-xl text-center shadow-sm">
         <div className="flex items-center justify-center gap-1 mb-1">
            <Icon size={10} className="text-surface-400" />
            <span className="text-[8px] font-bold text-surface-400 uppercase">{label}</span>
         </div>
         <p className="text-[10px] font-black text-surface-900">{value}</p>
      </div>
   );
}
