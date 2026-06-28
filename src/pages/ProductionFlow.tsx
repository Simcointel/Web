import { useState, useMemo } from "react";
import { RESOURCES } from "../data/simco_static";
import { Search, ChevronRight, Share2, Layers, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function ProductionFlowPage() {
  const [targetId, setTargetId] = useState<number>(2); // Default to Apples
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    RESOURCES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  , [search]);

  const tree = useMemo(() => {
    const buildTree = (id: number, depth = 0): any => {
      const res = RESOURCES.find(r => r.id === id);
      if (!res || depth > 4) return { id, name: res?.name || '?', inputs: [] };
      const inputs = res.inputs ? Object.entries(res.inputs).map(([iid, qty]) => ({
        ...buildTree(Number(iid), depth + 1),
        qty
      })) : [];
      return { id, name: res.name, inputs };
    };
    return buildTree(targetId);
  }, [targetId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-surface-200 dark:border-surface-800">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-lg border border-brand-100 dark:border-brand-800">
               <Share2 size={24} />
            </div>
            <div>
               <h1 className="text-2xl font-black uppercase italic tracking-tighter">Chain.<span className="text-brand-600">Visualizer</span></h1>
               <p className="text-[9px] font-black uppercase text-surface-400 tracking-[0.3em] mt-0.5">Recursive Resource Dependency Matrix</p>
            </div>
         </div>

         <div className="relative group w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Find Resource Tree..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-10 !py-2 !rounded-xl shadow-lg !border-none !bg-white dark:!bg-surface-900 shadow-brand-500/5 focus:ring-4 focus:ring-brand-500/10"
            />
            {search && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 z-50 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="max-h-48 overflow-y-auto scrollbar-hide">
                     {filtered.slice(0, 10).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setTargetId(r.id); setSearch(""); }}
                          className="w-full text-left p-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center transition-all border-b border-surface-50 dark:border-surface-800 last:border-0 group/item"
                        >
                           <span className="text-xs font-black uppercase italic tracking-tighter text-surface-700 dark:text-surface-300 group-hover/item:text-brand-600 transition-colors">{r.name}</span>
                           <div className="w-6 h-6 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover/item:bg-brand-600 group-hover/item:text-white transition-all"><ChevronRight size={14} /></div>
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="card !bg-surface-50/20 dark:!bg-surface-950/20 p-8 min-h-[60vh] overflow-x-auto flex flex-col items-center justify-start border-dashed border-2 shadow-inner">
         <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <TreeNode node={tree} isRoot />
         </motion.div>
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot, qty }: { node: any; isRoot?: boolean; qty?: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className={`p-4 rounded-3xl border-2 transition-all duration-500 group relative ${isRoot ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-950 shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-110 z-10 border-brand-500' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-brand-500'}`}>
          {qty && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white rounded-full text-[9px] font-black shadow-lg z-20 uppercase italic tracking-widest border-2 border-white dark:border-surface-900">
                {qty} Units
             </div>
          )}
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRoot ? 'bg-white/10 dark:bg-surface-900/10' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-inner'}`}>
                {isRoot ? <Zap size={16} /> : <Layers size={14} />}
             </div>
             <span className="text-sm font-black uppercase italic tracking-tighter whitespace-nowrap">{node.name}</span>
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-8 mt-12 relative">
             <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-gradient-to-b from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 opacity-30 rounded-full" />
             {node.inputs.map((input: any, i: number) => (
                <div key={i} className="relative pt-4">
                   <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400 opacity-10 rounded-full" />
                   <TreeNode node={input} qty={input.qty} />
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
