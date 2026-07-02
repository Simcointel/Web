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
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-800">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md">
               <Share2 size={24} />
            </div>
            <h1 className="text-2xl font-bold italic tracking-tight">Production Flow Visualizer</h1>
         </div>

         <div className="relative group w-full max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search resource to map..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {search && (
               <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-950 border border-surface-100 dark:border-surface-800 z-50 rounded shadow-2xl overflow-hidden">
                  <div className="max-h-40 overflow-y-auto scrollbar-hide">
                     {filtered.slice(0, 8).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setTargetId(r.id); setSearch(""); }}
                          className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center transition-all border-b border-surface-50 dark:border-surface-800 last:border-0"
                        >
                           <span className="text-[10px] font-black uppercase text-surface-600 dark:text-surface-400">{r.name}</span>
                           <ChevronRight size={10} className="text-surface-300" />
                        </button>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="card !bg-transparent p-4 min-h-[60vh] overflow-x-auto flex flex-col items-center justify-start border-none">
         <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <TreeNode node={tree} isRoot />
         </motion.div>
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot, qty }: { node: any; isRoot?: boolean; qty?: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className={`p-4 px-6 rounded-xl border transition-all duration-300 group relative ${isRoot ? 'bg-brand-600 text-white shadow-md border-brand-700' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-500 shadow-sm'}`}>
          {qty && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold shadow-md z-20 uppercase tracking-widest border border-white dark:border-surface-900">
                {qty} Units
             </div>
          )}
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRoot ? 'bg-white/20' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'}`}>
                {isRoot ? <Zap size={18} /> : <Layers size={14} />}
             </div>
             <span className="text-sm font-bold uppercase tracking-wide whitespace-nowrap">{node.name}</span>
          </div>
       </div>

       {node.inputs && node.inputs.length > 0 && (
          <div className="flex gap-8 mt-12 relative">
             <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-surface-200 dark:bg-surface-800" />
             {node.inputs.map((input: any, i: number) => (
                <div key={i} className="relative pt-4">
                   <div className="absolute top-0 left-0 right-0 h-0.5 bg-surface-100 dark:bg-surface-800/50" />
                   <TreeNode node={input} qty={input.qty} />
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
