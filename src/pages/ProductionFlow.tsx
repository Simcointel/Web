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
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-surface-200 dark:border-surface-800">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-[1.5rem] flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-xl border border-brand-100 dark:border-brand-800">
               <Share2 size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black uppercase italic tracking-tighter">Chain.<span className="text-brand-600">Visualizer</span></h1>
               <p className="text-[10px] font-black uppercase text-surface-400 tracking-[0.3em] mt-1">Recursive Resource Dependency Matrix</p>
            </div>
         </div>

         <div className="relative group w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Find Resource Tree..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-12 !py-4 !rounded-2xl shadow-xl !border-none !bg-white dark:!bg-surface-900 shadow-brand-500/5 focus:ring-4 focus:ring-brand-500/10"
            />
            {search && (
               <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 z-50 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                     {filtered.slice(0, 10).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setTargetId(r.id); setSearch(""); }}
                          className="w-full text-left p-4 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center transition-all border-b border-surface-50 dark:border-surface-800 last:border-0 group/item"
                        >
                           <span className="text-sm font-black uppercase italic tracking-tighter text-surface-700 dark:text-surface-300 group-hover/item:text-brand-600 transition-colors">{r.name}</span>
                           <div className="w-8 h-8 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover/item:bg-brand-600 group-hover/item:text-white transition-all"><ChevronRight size={16} /></div>
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="card !bg-surface-50/20 dark:!bg-surface-950/20 p-16 min-h-[70vh] overflow-x-auto flex flex-col items-center justify-start border-dashed border-2 shadow-inner">
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
       <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 group relative ${isRoot ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-950 shadow-[0_20px_50px_rgba(0,0,0,0.2)] scale-110 z-10 border-brand-500' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:border-brand-500'}`}>
          {qty && (
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-brand-600 text-white rounded-full text-[10px] font-black shadow-xl z-20 uppercase italic tracking-widest border-2 border-white dark:border-surface-900">
                {qty} Units
             </div>
          )}
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRoot ? 'bg-white/10 dark:bg-surface-900/10' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-inner'}`}>
                {isRoot ? <Zap size={24} /> : <Layers size={22} />}
             </div>
             <span className="text-lg font-black uppercase italic tracking-tighter whitespace-nowrap">{node.name}</span>
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-16 mt-20 relative">
             <div className="absolute -top-20 left-1/2 w-1 h-20 bg-gradient-to-b from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 opacity-40 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)]" />
             {node.inputs.map((input: any, i: number) => (
                <div key={i} className="relative pt-6">
                   <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 dark:bg-brand-400 opacity-10 rounded-full" />
                   <TreeNode node={input} qty={input.qty} />
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
